`timescale 1ns / 1ps
//======================================================================
// tb_fpga_top.v : simulation of the board demo (fpga_top)
//
//   mode 0 (SW15 = 0) : 5-bit A, B, M from the switches (zero-padded to 256 bit)
//   mode 1 (SW15 = 1) : 256-bit A, B, M from the VIO
//
// The signals written in CAPITAL LETTERS below are made for the timing
// diagram (waveform): case_name, MODE, A_SW, B_SW, M_SW, A_CORE, B_CORE,
// M_CORE, RESULT, RESULT_LOW, ERROR, BUSY, DONE, STATE.
// Load them with add_waves.tcl (see README) .
//
// Every case also checks the LED state ticks (LED[11:4]): good run = 11111111, error = 00000000.
// Expected end of the console log:  FAIL=0  /  ALL TESTS PASSED
//======================================================================
module tb_fpga_top;
    localparam SHOW_SEG_IN_BIG = 1;      // must be the same as the fpga_top parameter

    reg clk = 0; always #5 clk = ~clk;   // 100 MHz board clock
    reg [15:0] sw = 16'd0;
    reg btnc = 0, btnr = 0, btnl = 0, cpu_resetn = 0;
    wire [11:0] led; wire led15;
    wire led16_r, led16_g, led16_b, led17_r, led17_g, led17_b;
    wire [6:0] seg; wire dp; wire [7:0] an;

    // DEBOUNCE_CYCLES shortened and VIO replaced by testbench regs: simulation only
    fpga_top #(.DEBOUNCE_CYCLES(20), .SIM_BYPASS_VIO(1), .SHOW_SEG_IN_BIG(SHOW_SEG_IN_BIG), .STRETCH_CYCLES(2000)) dut (
        .clk(clk), .sw(sw), .btnc(btnc), .btnr(btnr), .btnl(btnl), .cpu_resetn(cpu_resetn),
        .led(led), .led15(led15),
        .led16_r(led16_r), .led16_g(led16_g), .led16_b(led16_b),
        .led17_r(led17_r), .led17_g(led17_g), .led17_b(led17_b),
        .seg(seg), .dp(dp), .an(an));

    // ---------------- named signals for the timing diagram ----------------
    reg  [8*28-1:0] case_name = "";           // which case is running
    wire         MODE       = sw[15];         // 0 = board switches, 1 = VIO
    wire [4:0]   A_SW       = sw[4:0];        // mode 0 inputs
    wire [4:0]   B_SW       = sw[9:5];
    wire [4:0]   M_SW       = sw[14:10];
    wire [255:0] A_CORE     = dut.a_in;       // what the 256-bit core really receives
    wire [255:0] B_CORE     = dut.b_in;
    wire [255:0] M_CORE     = dut.m_in;
    wire [255:0] RESULT     = dut.result_wire;
    wire [31:0]  RESULT_LOW = dut.result_wire[31:0];   // easy to read in decimal
    wire         ERROR      = dut.error_wire;
    wire         BUSY       = dut.busy_wire;
    wire         DONE       = dut.done_wire;
    wire [3:0]   STATE      = dut.dbg_state_wire;

    integer pass_cnt = 0, fail_cnt = 0, t;
    reg started = 1'b0;                                 // set when a start pulse reaches modmul_top
    always @(posedge dut.clk_sys) if (dut.start) started <= 1'b1;

    function [6:0] hex7(input [3:0] n);                 // active-low segment pattern
        case (n)
            4'h0: hex7=7'b1000000; 4'h1: hex7=7'b1111001; 4'h2: hex7=7'b0100100;
            4'h3: hex7=7'b0110000; 4'h4: hex7=7'b0011001; 4'h5: hex7=7'b0010010;
            4'h6: hex7=7'b0000010; 4'h7: hex7=7'b1111000; 4'h8: hex7=7'b0000000;
            4'h9: hex7=7'b0010000; 4'hA: hex7=7'b0001000; 4'hB: hex7=7'b0000011;
            4'hC: hex7=7'b1000110; 4'hD: hex7=7'b0100001; 4'hE: hex7=7'b0000110;
            default: hex7=7'b0001110;
        endcase
    endfunction

    // ---------------- mode 0 : 5-bit switches ----------------
    task run(input [4:0] a, input [4:0] b, input [4:0] m, input exp_err, input [4:0] exp,
             input [8*28-1:0] nm);
        reg [6:0] seg0;
        reg ok;
    begin
        case_name = nm;
        sw = {1'b0, m, b, a};                           // SW15 = 0 (mode 0)
        repeat (5) @(posedge dut.clk_sys);
        started = 1'b0;
        btnc = 1; repeat (60) @(posedge dut.clk_sys);   // hold longer than debounce
        btnc = 0; repeat (10) @(posedge dut.clk_sys);
        t = 0;
        while (!dut.done_wire && t < 200000) begin @(posedge dut.clk_sys); t = t + 1; end
        repeat (5) @(posedge dut.clk_sys);
        while (an !== 8'b1111_1110) @(posedge dut.clk_sys);   // wait for digit 0
        @(posedge dut.clk_sys); @(posedge dut.clk_sys);
        seg0 = seg;
        ok = started && dut.done_wire && (dut.error_wire === exp_err);
        // LED[11:4] state ticks: good run = all 8 states visited, rejected input = none
        ok = ok && (led[11:4] === (exp_err ? 8'h00 : 8'hFF));
        ok = ok && (led[3:0] === 4'b0000) && (led17_r === 1'b0) && (led17_g === 1'b0) && (led17_b === 1'b0);   // mode 0: LED0-3 and RGB17 off
        if (!exp_err) ok = ok && (dut.result_wire === {251'b0, exp}) && (seg0 === hex7(exp[3:0]));
        else          ok = ok && (seg0 === 7'b0000110);          // E on the display
        if (ok) begin pass_cnt = pass_cnt + 1;
            $display("PASS mode0  A=%0d B=%0d M=%0d -> result=%0d err=%b (%0d cycles)  %0s", a, b, m, dut.result_wire[4:0], dut.error_wire, t, nm);
        end else begin fail_cnt = fail_cnt + 1;
            $display("FAIL mode0  A=%0d B=%0d M=%0d -> result=%0d err=%b started=%b exp=%0d exp_err=%b seg0=%b ticks=%b  %0s", a, b, m, dut.result_wire[4:0], dut.error_wire, started, exp, exp_err, seg0, led[11:4], nm);
        end
    end endtask

    // ---------------- mode 1 : 256-bit values from the VIO ----------------
    // On the board vio_0 is driven over JTAG. In simulation fpga_top is built with
    // SIM_BYPASS_VIO = 1 and the testbench writes dut.sim_a / sim_b / sim_m / sim_start.
    task run_big(input [255:0] a, input [255:0] b, input [255:0] m, input exp_err, input [255:0] exp,
                 input [8*28-1:0] nm);
        reg [6:0] seg0;
        reg ok;
    begin
        case_name = nm;
        sw = 16'h8000;                                  // SW15 = 1 (mode 1)
        dut.sim_a = a;  dut.sim_b = b;  dut.sim_m = m;
        repeat (5) @(posedge dut.clk_sys);
        started = 1'b0;
        dut.sim_start = 1'b1;                           // VIO start is a level
        repeat (5) @(posedge dut.clk_sys);
        dut.sim_start = 1'b0;
        repeat (10) @(posedge dut.clk_sys);
        t = 0;
        while (!dut.done_wire && t < 200000) begin @(posedge dut.clk_sys); t = t + 1; end
        repeat (5) @(posedge dut.clk_sys);
        while (an !== 8'b1111_1110) @(posedge dut.clk_sys);
        @(posedge dut.clk_sys); @(posedge dut.clk_sys);
        seg0 = seg;
        ok = started && dut.done_wire && (dut.error_wire === exp_err);
        ok = ok && (led[11:4] === (exp_err ? 8'h00 : 8'hFF));          // state ticks
        if (!exp_err) ok = ok && (dut.result_wire === exp);
        // mode 1 is virtual: the 7-segment must be blank (unless SHOW_SEG_IN_BIG = 1)
        if (SHOW_SEG_IN_BIG == 0) ok = ok && (seg0 === 7'b1111111);
        else if (exp_err)         ok = ok && (seg0 === 7'b0000110);
        else                      ok = ok && (seg0 === hex7(exp[3:0]));
        ok = ok && (led[2:0] === 3'd0) && (led[3] === ((!exp_err) && (|exp[255:32])));   // page 0 after start; LED3 = upper bits flag
        if (ok) begin pass_cnt = pass_cnt + 1;
            $display("PASS mode1  err=%b result=%h (%0d cycles)  %0s", dut.error_wire, dut.result_wire, t, nm);
        end else begin fail_cnt = fail_cnt + 1;
            $display("FAIL mode1  started=%b err=%b exp_err=%b ticks=%b  %0s\n   got=%h\n   exp=%h", started, dut.error_wire, exp_err, led[11:4], nm, dut.result_wire, exp);
        end
    end endtask

    // ---------------- mode isolation ----------------
    task btn_starts_in_mode1;            // mode 1: BTNC must start the calculation (VIO values)
        integer w;
    begin
        case_name = "mode1: BTNC starts";
        sw = 16'h8000;
        dut.sim_a = 256'd3; dut.sim_b = 256'd5; dut.sim_m = 256'd7;
        repeat (5) @(posedge dut.clk_sys);
        started = 1'b0;
        btnc = 1; repeat (60) @(posedge dut.clk_sys); btnc = 0;
        repeat (10) @(posedge dut.clk_sys);
        w = 0;
        while (!dut.done_wire && w < 200000) begin @(posedge dut.clk_sys); w = w + 1; end
        repeat (5) @(posedge dut.clk_sys);
        if (started && dut.done_wire && !dut.error_wire && dut.result_wire === 256'd1) begin pass_cnt = pass_cnt + 1; $display("PASS BTNC starts calculation in mode 1"); end
        else begin fail_cnt = fail_cnt + 1; $display("FAIL BTNC did not start the core in mode 1"); end
    end endtask

    task vio_start_ignored_in_mode0;     // mode 0: VIO start must NOT start anything
    begin
        case_name = "mode0: VIO start ignored";
        sw = {1'b0, 5'd7, 5'd5, 5'd3};
        repeat (5) @(posedge dut.clk_sys);
        started = 1'b0;
        dut.sim_start = 1'b1; repeat (10) @(posedge dut.clk_sys);
        dut.sim_start = 1'b0; repeat (100) @(posedge dut.clk_sys);
        if (!started && dut.busy_wire === 1'b0) begin pass_cnt = pass_cnt + 1; $display("PASS VIO start ignored in mode 0"); end
        else begin fail_cnt = fail_cnt + 1; $display("FAIL VIO start started the core in mode 0"); end
    end endtask

    // ---------------- mode 1 : page navigation (BTNR / BTNL) ----------------
    task press(input which);             // which = 1: BTNR, 0: BTNL
    begin
        if (which) btnr = 1; else btnl = 1;
        repeat (60) @(posedge dut.clk_sys);
        btnr = 0; btnl = 0;
        repeat (60) @(posedge dut.clk_sys);
    end endtask

    task check_page(input [2:0] p, input [255:0] exp, input [8*28-1:0] nm);
        reg [6:0] sg; reg ok; integer k;
    begin
        case_name = nm;
        k = 0;
        while (an !== 8'b1111_1110 && k < 100000) begin @(posedge dut.clk_sys); k = k + 1; end
        @(posedge dut.clk_sys); @(posedge dut.clk_sys);
        sg = seg;
        ok = (led[2:0] === p) && (sg === hex7(exp[p*32 +: 4]));
        if (ok) begin pass_cnt = pass_cnt + 1; $display("PASS page %0d  LED[2:0]=%b  %0s", p, led[2:0], nm); end
        else begin fail_cnt = fail_cnt + 1; $display("FAIL page %0d  LED[2:0]=%b seg=%b %0s", p, led[2:0], sg, nm); end
    end endtask

    // ---------------- main ----------------
    initial begin
        repeat (20) @(posedge dut.clk_sys); cpu_resetn = 1; repeat (50) @(posedge dut.clk_sys);

        $display("---------- mode 0 (SW15 = 0): 5-bit switches ----------");
        run(5'd3,  5'd5,  5'd7,  0, 5'd1,  "3*5 mod 7 = 1");
        run(5'd0,  5'd5,  5'd7,  0, 5'd0,  "0*5 mod 7 = 0");
        run(5'd6,  5'd6,  5'd7,  0, 5'd1,  "6*6 mod 7 = 1");
        run(5'd30, 5'd29, 5'd31, 0, 5'd2,  "30*29 mod 31 = 2");
        run(5'd6,  5'd2,  5'd7,  0, 5'd5,  "6*2 mod 7 = 5 (A=M-1)");
        run(5'd0,  5'd0,  5'd1,  0, 5'd0,  "M=1 -> 0");
        run(5'd2,  5'd3,  5'd8,  1, 5'd0,  "M EVEN -> ERROR");
        run(5'd7,  5'd3,  5'd5,  1, 5'd0,  "A>=M -> ERROR");
        run(5'd3,  5'd7,  5'd5,  1, 5'd0,  "B>=M -> ERROR");
        vio_start_ignored_in_mode0;

        $display("---------- mode 1 (SW15 = 1): 256-bit VIO ----------");
        btn_starts_in_mode1;
        run_big(256'h1aeb5af88e7aa6e99f19950499dd251de512148239292d22e255accb1a466884,
                256'h1f6afa4ac4a334bfc6cd75e9bb049a79d7a7a3cc8c3d5f169293de8fc88b2875,
                256'h3cfd2492dc28ff90a5aec7978306d03bf38b2ffc80a4df5a51c9bc701e7ea419,
                0, 256'h12e1751f8566e93b921cc430b9ba135af946732e1310cd262a786ffeebaa1993, "BIG random 1");
        run_big(256'h02c800d6406329bc65b00a2d35d148805071950eadec6f117d836e77af67d461,
                256'h044df4e08eb5140f16f4488157241955b91dddd91389b372a341738c837a7935,
                256'h052a939c9d3c7dec00a61f933d6c51e370eb9a0a96263ae6c5e818fac0433cbd,
                0, 256'h04518a46f3a4a8cd65d1251166b826679294e93276ec1e60ac766187dae7fcbf, "BIG random 2");
        run_big(256'h1d8236505d111a9d5e6c9992b5fb12e0d9090b89065550964f1a8a1d93d20470,
                256'h241893f86b82e6c9d82fb0f1423674a6864fa3f3eab06e9b65ed0de47db4304d,
                256'h2dd9bfc4b437bdb5a51149bbe060a72424114258751b4c8349a047dc4ac87fc1,
                0, 256'h2a9ac04b42e550143e68e55a90d151fec088c9e41fda25e1b526ab52b3fda10e, "BIG random 3");
        run_big(256'h0000000000000000000000000000000000000000000000000000000000000000,
                256'h217c6138b464c554f675299b0c83e786d1711cbd2106119ec40d31b5397a7623,
                256'h24d54210067f0cfcce1fd3d9849acfb58350a73f7aac319ffb759e0fed1d9d17,
                0, 256'h0000000000000000000000000000000000000000000000000000000000000000, "BIG A=0 -> 0");
        run_big(256'h091d498f785490146dedc86a9f4fb02bb7a1774f1a42721eaba4c70ee306f0c4,
                256'h08c537654ec0a954ff8b2a6aab74fe5766eebc578f4ecb4f4041f5ee8bae8e66,
                256'h091d498f785490146dedc86a9f4fb02bb7a1774f1a42721eaba4c70ee306f0c5,
                0, 256'h0058122a2993e6bf6e629dfff3dab1d450b2baf78af3a6cf6b62d1205758625f, "BIG A=M-1");
        run_big(256'h19b98449e26b524ace0d8d877a98b9acb2c55523807c7e30a598d0dbccbfd2ec,
                256'h19b98449e26b524ace0d8d877a98b9acb2c55523807c7e30a598d0dbccbfd2ec,
                256'h19b98449e26b524ace0d8d877a98b9acb2c55523807c7e30a598d0dbccbfd2ed,
                0, 256'h0000000000000000000000000000000000000000000000000000000000000001, "BIG A=B=M-1 -> 1");
        run_big(256'h0000000000000000000000000000000000000000000000000000000000000003,
                256'h0000000000000000000000000000000000000000000000000000000000000005,
                256'h09970a3a0879d955025ff87c44df8a13d4f398ee4b5c1a9533d918086edd77da,
                1, 256'h0000000000000000000000000000000000000000000000000000000000000000, "BIG M EVEN -> ERROR");
        run_big(256'h3b53466e85dc0a68cdb54088754e64f4f5ee8c7298e6e5b7e1cd7be8a7d83351,
                256'h0000000000000000000000000000000000000000000000000000000000000001,
                256'h3b53466e85dc0a68cdb54088754e64f4f5ee8c7298e6e5b7e1cd7be8a7d83351,
                1, 256'h0000000000000000000000000000000000000000000000000000000000000000, "BIG A=M (A>=M) -> ERROR");
        run_big(256'h0000000000000000000000000000000000000000000000000000000000000003,
                256'h0000000000000000000000000000000000000000000000000000000000000005,
                256'h4000000000000000000000000000000000000000000000000000000000000001,
                1, 256'h0000000000000000000000000000000000000000000000000000000000000000, "BIG M>=2^254 -> ERROR");

        $display("---------- mode 1 page buttons ----------");
        // result of BIG random 3 is still on the outputs; walk through the pages
        begin : pages
            reg [255:0] r; integer i;
            r = dut.result_wire;
            sw = 16'h8000;
            run_big(256'h1d8236505d111a9d5e6c9992b5fb12e0d9090b89065550964f1a8a1d93d20470,
                    256'h241893f86b82e6c9d82fb0f1423674a6864fa3f3eab06e9b65ed0de47db4304d,
                    256'h2dd9bfc4b437bdb5a51149bbe060a72424114258751b4c8349a047dc4ac87fc1,
                    0, 256'h2a9ac04b42e550143e68e55a90d151fec088c9e41fda25e1b526ab52b3fda10e, "pages: calc");
            r = dut.result_wire;
            check_page(3'd0, r, "page 0 after start");
            for (i = 1; i < 8; i = i + 1) begin press(1'b1); check_page(i[2:0], r, "BTNR next page"); end
            press(1'b1); check_page(3'd0, r, "BTNR wraps 7 -> 0");
            press(1'b0); check_page(3'd7, r, "BTNL wraps 0 -> 7");
            press(1'b0); check_page(3'd6, r, "BTNL previous page");
            // new calculation must return to page 0
            run_big(256'h1d8236505d111a9d5e6c9992b5fb12e0d9090b89065550964f1a8a1d93d20470,
                    256'h241893f86b82e6c9d82fb0f1423674a6864fa3f3eab06e9b65ed0de47db4304d,
                    256'h2dd9bfc4b437bdb5a51149bbe060a72424114258751b4c8349a047dc4ac87fc1,
                    0, 256'h2a9ac04b42e550143e68e55a90d151fec088c9e41fda25e1b526ab52b3fda10e, "pages: restart -> page 0");
        end

        $display("=========================================");
        $display("TOTAL PASS=%0d  FAIL=%0d", pass_cnt, fail_cnt);
        if (fail_cnt == 0) $display("ALL TESTS PASSED"); else $display("SOME TESTS FAILED");
        $finish;
    end
endmodule
