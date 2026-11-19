`timescale 1ns / 1ps
//======================================================================
// modmul_top.v
//
// Test wrapper: normal-domain  A, B, M  ->  normal-domain  (A*B) mod M
//
// Uses the unmodified GitHub montprod core (length = 8 words = 256 bit).
// Core computes MontProd(x,y) = x*y*R^-1 mod M, with R = 2^256.
//
// Steps done internally (nothing hardcoded, R^2 mod M computed in HW):
//   0) R2 = 2^512 mod M     (512 x "double and conditionally subtract M")
//   1) A' = MontProd(A , R2) = A*R mod M
//   2) B' = MontProd(B , R2) = B*R mod M
//   3) P' = MontProd(A', B') = A*B*R mod M
//   4) P  = MontProd(P', 1)  = A*B   mod M      -> result
//
// Requirements on the inputs (limits of the montprod core):
//   * M odd
//   * M < 2^254   (top 2 bits of M must be 0)
//   * A < M, B < M
// If violated, 'error' goes high and 'done' is set immediately.
//
// Usage: put a_in/b_in/m_in, pulse 'start' for 1 clock, wait for 'done',
//        read 'result_out'. 'done' stays high until the next 'start'.
//======================================================================
module modmul_top (
    input  wire         clk,
    input  wire         reset_n,

    input  wire         start,
    input  wire [255:0] a_in,
    input  wire [255:0] b_in,
    input  wire [255:0] m_in,

    output reg          busy,
    output reg          done,
    output reg          error,
    output reg  [255:0] result_out,
    output wire [3:0]   dbg_state   // wrapper FSM state for LEDs (no logic change)

);

    // ---------------- operand registers ----------------
    reg [255:0] A_r, B_r, M_r;
    reg [255:0] x;                 // doubling register -> ends up as R2 mod M
    reg [255:0] Am;        // Am = T = A*B*R^-1 mod M (result of call 1)
    reg [255:0] res_vec;           // result collected from the core
    reg [9:0]   cnt;
    reg [1:0]   pass;

    // ---------------- core interface ----------------
    reg         core_calc;
    wire        core_ready;
    wire [7:0]  opa_addr, opb_addr, opm_addr, res_addr;
    wire [31:0] res_data;
    wire        res_we;
    reg  [31:0] opa_data, opb_data, opm_data;

    // Operand memories behave like synchronous BRAM (1 cycle read latency),
    // which is what montprod expects. Word 0 = MSW, word 7 = LSW.
    always @(posedge clk) begin
        case (pass)                                  // operand A
        2'd0:    opa_data <= A_r[(7 - opa_addr[2:0]) * 32 +: 32];  // call 1: A
        default: opa_data <= Am [(7 - opa_addr[2:0]) * 32 +: 32];  // call 2: T
    endcase
    case (pass)                                  // operand B
        2'd0:    opb_data <= B_r[(7 - opb_addr[2:0]) * 32 +: 32];  // call 1: B
        default: opb_data <= x  [(7 - opb_addr[2:0]) * 32 +: 32];  // call 2: R^2
    endcase
    
        opm_data <= M_r    [(7 - opm_addr[2:0]) * 32 +: 32];
    end

    always @(posedge clk)
        if (res_we)
            res_vec[(7 - res_addr[2:0]) * 32 +: 32] <= res_data;

    montprod u_core (
        .clk(clk), .reset_n(reset_n),
        .calculate(core_calc), .ready(core_ready),
        .length(8'd8),
        .opa_addr(opa_addr), .opa_data(opa_data),
        .opb_addr(opb_addr), .opb_data(opb_data),
        .opm_addr(opm_addr), .opm_data(opm_data),
        .result_addr(res_addr), .result_data(res_data), .result_we(res_we)
    );

    // ---------------- helper arithmetic ----------------
        // ---------------- helper arithmetic ----------------
        reg          ms_start;
        wire         ms_chain = (state == S_R2) && (cnt != 10'd511);
        wire         ms_done, ms_lt;
        wire [255:0] ms_res;
        wire [255:0] ms_x = (state == S_CHKA) ? A_r :
                            (state == S_CHKB) ? B_r :
                            (state == S_R2)   ? {x[254:0], 1'b0} : res_vec;
    
        modsub256 #(.N(256), .SLICE_W(128)) u_sub (
            .clk(clk), .reset_n(reset_n),
            .start(ms_start), .chain(ms_chain),
            .x(ms_x), .m(M_r),
            .done(ms_done), .lt(ms_lt), .result(ms_res));
            

    // ---------------- FSM ----------------
    localparam S_IDLE = 4'd0,  S_R2   = 4'd1,  S_LOAD = 4'd2,  S_CALC = 4'd3,
               S_W1   = 4'd4,  S_W2   = 4'd5,  S_WAIT = 4'd6,  S_STORE = 4'd7,
               S_DONE = 4'd8,  S_CHKA = 4'd9,  S_CHKB = 4'd10;
    reg [3:0] state;    
    assign dbg_state = state;   // only a wire to the existing state register


    always @(posedge clk or negedge reset_n) begin
        if (!reset_n) begin
            state <= S_IDLE; busy <= 1'b0; done <= 1'b0; error <= 1'b0;
            core_calc <= 1'b0; result_out <= 256'd0; pass <= 2'd0; cnt <= 10'd0;
            ms_start <= 1'b0;
        end else begin
            case (state)
                S_IDLE: begin
                    core_calc <= 1'b0;
                    if (start) begin
                        A_r <= a_in; B_r <= b_in; M_r <= m_in;
                        done <= 1'b0; error <= 1'b0;
                        if (m_in[0] == 1'b0 || m_in[255:254] != 2'b00) begin
                            error <= 1'b1; done <= 1'b1;      // bad M
                        end else begin
                            busy     <= 1'b1;
                            ms_start <= 1'b1;                 // check A < M first
                            state    <= S_CHKA;
                        end
                    end
                end

                S_CHKA: begin
                    ms_start <= 1'b0;
                    if (ms_done) begin
                        if (!ms_lt) begin                     // A >= M
                            error <= 1'b1; done <= 1'b1; busy <= 1'b0; state <= S_IDLE;
                        end else begin
                            ms_start <= 1'b1;                 // now check B
                            state    <= S_CHKB;
                        end
                    end
                end

                S_CHKB: begin
                    ms_start <= 1'b0;
                    if (ms_done) begin
                        if (!ms_lt) begin                     // B >= M
                            error <= 1'b1; done <= 1'b1; busy <= 1'b0; state <= S_IDLE;
                        end else begin
                            x        <= 256'd1;               // start with 1, double 512 times
                            cnt      <= 10'd0;
                            pass     <= 2'd0;
                            ms_start <= 1'b1;
                            state    <= S_R2;
                        end
                    end
                end
                
                // x = 2^512 mod M  (= R^2 mod M for R = 2^256)
                S_R2: begin
                    ms_start <= 1'b0;
                    if (ms_done) begin
                        x   <= ms_res;
                        cnt <= cnt + 1'b1;
                        if (cnt == 10'd511) state <= S_LOAD;
                    end
                end

                S_LOAD: state <= S_CALC;

                S_CALC: begin core_calc <= 1'b1; state <= S_W1; end
                S_W1:   begin core_calc <= 1'b0; state <= S_W2; end   // core samples calculate here
                S_W2:   begin state <= S_WAIT; end                    // let ready_reg drop to 0
                                S_WAIT: if (core_ready) begin
                    ms_start <= 1'b1;                // 1-clock pulse to modsub256
                    state    <= S_STORE;
                end

                S_STORE: begin
                    ms_start <= 1'b0;
                    if (ms_done) begin
                        if (pass == 2'd0) Am <= ms_res;           // T = A*B*R^-1 mod M
                    else              result_out <= ms_res;   // T*R^2*R^-1 = A*B mod M
                    pass  <= pass + 1'b1;
                    state <= (pass == 2'd1) ? S_DONE : S_LOAD;
                    end
                end

                S_DONE: begin
                    busy <= 1'b0; done <= 1'b1; state <= S_IDLE;
                end

                default: state <= S_IDLE;
            endcase
        end
    end

        
endmodule

