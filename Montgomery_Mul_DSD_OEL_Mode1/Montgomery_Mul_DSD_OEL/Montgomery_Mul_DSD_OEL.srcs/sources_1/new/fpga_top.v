`timescale 1ns / 1ps
//======================================================================
// fpga_top.v : Nexys A7-100T board demo around modmul_top
//
//  SW15 = 0 (small mode): A = SW[4:0], B = SW[9:5], M = SW[14:10],
//                         zero-extended to 256 bit, start = BTNC
//  SW15 = 1 (big mode)  : A, B, M, start come from vio_0 (256 bit)
//
//  The core (modmul_top / montprod) is the SAME in both modes and is
//  still a 256-bit core: the small values just have 251 leading zeros.
//
//  CLOCK: the 100 MHz board clock drives everything directly (clk_sys = clk).
//  The long R^2 / compare paths were sliced in modsub256 (CEP OPT-1).
//
//  Outputs: 7-seg = result_out[31:0] (E on error), LED[11:4] = state ticks,
//           LED15 = mode, RGB16 = status, RGB17 = mode colour.
//
//  MODE 1 additions (mode 0 untouched):
//   - start = BTNC or VIO probe_out0
//   - 7-seg shows one 32-bit page of the 256-bit result (page 0 = result[31:0])
//   - BTNR = next page, BTNL = previous page (wraps 7 <-> 0); page = 0 on every new start
//   - LED2..LED0 = page number (binary)
//   - LED3 = 1 if result[255:32] has any 1 and run finished without error
//======================================================================
module fpga_top #(
    parameter DEBOUNCE_CYCLES = 1_000_000,         // 10 ms at 100 MHz (clk_sys)
    parameter SIM_BYPASS_VIO  = 0,                 // 1 = simulation only: testbench drives sim_* regs instead of vio_0
    parameter SHOW_SEG_IN_BIG = 1,                 // 1 = 7-segment active in mode 1 (paged result); 0 = blank in mode 1
    parameter STRETCH_CYCLES  = 30_000_000         // yellow (busy) is kept visible for ~0.3 s at 100 MHz
)(
    input  wire        clk,
    input  wire [15:0] sw,
    input  wire        btnc,
    input  wire        btnr,                       // mode 1: next page
    input  wire        btnl,                       // mode 1: previous page
    input  wire        cpu_resetn,                 // active low (board button)

    output wire [11:0] led,                        // LED4..LED11 = state ticks; LED0..LED3 = page / upper-bits flag (mode 1 only)
    output wire        led15,                      // mode
    output wire        led16_r, led16_g, led16_b,  // status RGB
    output wire        led17_r, led17_g, led17_b,  // mode RGB
    output wire [6:0]  seg,
    output wire        dp,
    output wire [7:0]  an
);

    // ---------------- system clock = board clock (100 MHz) ----------------
    wire clk_sys = clk;

    // ---------------- reset: power-on counter AND CPU_RESETN ----------------
    // Power-on reset: low for first 15 cycles, then high (same as old fpga_top)
    reg [3:0] por_cnt = 4'd0;
    wire      por_done = &por_cnt;
    always @(posedge clk_sys)
        if (!por_done) por_cnt <= por_cnt + 1'b1;

    wire rstn_sync;
    sync2 #(.WIDTH(1), .INIT(1'b0)) u_sync_rst (.clk(clk_sys), .d(cpu_resetn), .q(rstn_sync));

    reg reset_n = 1'b0;
    always @(posedge clk_sys) reset_n <= por_done & rstn_sync;

    // ---------------- switches and button ----------------
    wire [15:0] sw_s;
    sync2 #(.WIDTH(16)) u_sync_sw (.clk(clk_sys), .d(sw), .q(sw_s));

    wire btn_pulse;
    debounce_pulse #(.DEBOUNCE_CYCLES(DEBOUNCE_CYCLES)) u_btn
        (.clk(clk_sys), .btn_in(btnc), .pulse(btn_pulse));

    wire mode_big = sw_s[15];

    // page buttons (mode 1)
    wire btnr_pulse, btnl_pulse;
    debounce_pulse #(.DEBOUNCE_CYCLES(DEBOUNCE_CYCLES)) u_btnr
        (.clk(clk_sys), .btn_in(btnr), .pulse(btnr_pulse));
    debounce_pulse #(.DEBOUNCE_CYCLES(DEBOUNCE_CYCLES)) u_btnl
        (.clk(clk_sys), .btn_in(btnl), .pulse(btnl_pulse));

    // ---------------- VIO ----------------
    wire         vio_start_level;
    wire [255:0] a_vio, b_vio, m_vio;
    wire [255:0] result_wire;
    wire         done_wire, busy_wire, error_wire;
    wire [3:0]   dbg_state_wire;

    // [OEL-CHANGE 6] Simulation-only stand-in for the VIO outputs (used when SIM_BYPASS_VIO = 1).
    // On the board SIM_BYPASS_VIO = 0 and these regs are optimised away.
    reg          sim_start = 1'b0;
    reg  [255:0] sim_a = 256'd0, sim_b = 256'd0, sim_m = 256'd0;

    // VIO start is a level -> 1-clock pulse (rising edge)
    reg  vio_start_d = 1'b0;
    always @(posedge clk_sys) vio_start_d <= vio_start_level;
    wire vio_start_pulse = vio_start_level & ~vio_start_d;

    // ---------------- mode MUX ----------------   [OEL-CHANGE 2]
    // mode 0: 5-bit switches, zero-padded with 251 zeros to 256 bit (same core, same logic)
    // mode 1: 256-bit values from the VIO (your original way)
    wire [255:0] a_in  = mode_big ? a_vio : {251'b0, sw_s[4:0]};
    wire [255:0] b_in  = mode_big ? b_vio : {251'b0, sw_s[9:5]};
    wire [255:0] m_in  = mode_big ? m_vio : {251'b0, sw_s[14:10]};
    wire         start = mode_big ? (vio_start_pulse | btn_pulse) : btn_pulse;   // mode 1: VIO start or BTNC

    // ---------------- core ----------------
    modmul_top u_modmul (
        .clk        (clk_sys),
        .reset_n    (reset_n),
        .start      (start),
        .a_in       (a_in),
        .b_in       (b_in),
        .m_in       (m_in),
        .busy       (busy_wire),
        .done       (done_wire),
        .error      (error_wire),
        .result_out (result_wire),
        .dbg_state  (dbg_state_wire)
    );

    generate
        if (SIM_BYPASS_VIO) begin : g_sim_vio
            assign vio_start_level = sim_start;
            assign a_vio = sim_a;
            assign b_vio = sim_b;
            assign m_vio = sim_m;
        end else begin : g_real_vio
            vio_0 u_vio (
                .clk        (clk_sys),
                .probe_in0  (result_wire),
                .probe_in1  (done_wire),
                .probe_in2  (busy_wire),
                .probe_in3  (error_wire),
                .probe_out0 (vio_start_level),
                .probe_out1 (a_vio),
                .probe_out2 (b_vio),
                .probe_out3 (m_vio)
            );
        end
    endgenerate

    // ---------------- display / LEDs ----------------
    // ---------------- mode 1 result paging ----------------
    // 256-bit result = 8 pages of 32 bit. page 0 = result[31:0] ... page 7 = result[255:224]
    reg [2:0] page = 3'd0;
    always @(posedge clk_sys) begin
        if (!reset_n || start)  page <= 3'd0;              // every new calculation starts at page 0
        else if (mode_big) begin
            if (btnr_pulse)      page <= page + 1'b1;      // next page (7 -> 0)
            else if (btnl_pulse) page <= page - 1'b1;      // previous page (0 -> 7)
        end
    end
    wire [31:0] page_word = result_wire[page*32 +: 32];

    seg7_driver u_seg (   // mode 0: result[31:0]; mode 1: selected 32-bit page
        .clk(clk_sys), .value(mode_big ? page_word : result_wire[31:0]), .error(error_wire),
        .enable((~mode_big) | (SHOW_SEG_IN_BIG != 0)),
        .seg(seg), .an(an)
    );
    assign dp = 1'b1;                              // decimal point off (active low)

    // [OEL-CHANGE 8] busy lasts only ~0.6 ms, so the status LED would never be seen yellow.
    // Keep "busy" visible for STRETCH_CYCLES after the core stops (RGB only, core untouched).
    reg [31:0] busy_cnt = 32'd0;
    always @(posedge clk_sys)
        if (busy_wire)              busy_cnt <= STRETCH_CYCLES;
        else if (busy_cnt != 32'd0) busy_cnt <= busy_cnt - 1'b1;
    wire busy_view = busy_wire | (busy_cnt != 32'd0);

    rgb_driver u_rgb (
        .clk(clk_sys), .error(error_wire), .busy(busy_view), .done(done_wire),
        .mode_big(mode_big),
        .led16_r(led16_r), .led16_g(led16_g), .led16_b(led16_b),
        .led17_r(led17_r), .led17_g(led17_g), .led17_b(led17_b)
    );

    // ---------------- LEDs ----------------
    // [OEL-CHANGE 7] The live state (dbg_state) changes in microseconds, nobody can see it on LEDs,
    // so LED0..LED3 are NOT used. LED[11:4] keep a TICK for every wrapper state visited in the last run:
    //   LED4=S_R2  LED5=S_LOAD  LED6=S_CALC  LED7=S_W1  LED8=S_W2  LED9=S_WAIT  LED10=S_STORE  LED11=S_DONE
    // A good run lights all 8 ticks, a rejected input (error) lights none. Cleared at every start.
    reg [7:0] state_seen = 8'd0;
    always @(posedge clk_sys) begin
        if (!reset_n || start) state_seen <= 8'd0;
        else case (dbg_state_wire)
            4'd1: state_seen[0] <= 1'b1;
            4'd2: state_seen[1] <= 1'b1;
            4'd3: state_seen[2] <= 1'b1;
            4'd4: state_seen[3] <= 1'b1;
            4'd5: state_seen[4] <= 1'b1;
            4'd6: state_seen[5] <= 1'b1;
            4'd7: state_seen[6] <= 1'b1;
            4'd8: state_seen[7] <= 1'b1;
            default: ;
        endcase
    end

    // mode 1 only: LED2..LED0 = page number, LED3 = upper result bits [255:32] not zero (valid done only)
    wire upper_nz = |result_wire[255:32];
    wire [3:0] led_lo = mode_big ? {(done_wire & ~error_wire & upper_nz), page} : 4'b0000;

    assign led   = {state_seen, led_lo};
    assign led15 = mode_big;

endmodule
