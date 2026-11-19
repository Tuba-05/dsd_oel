`timescale 1ns / 1ps
// Self-checking testbench for modsub256 (compares with the Verilog % / >= operators)
module tb_modsub256;
    parameter SLICE_W = 128;
    reg clk = 0, reset_n = 0, start = 0, chain = 0;
    reg  [255:0] x, m;
    wire done, lt;
    wire [255:0] result;
    integer errors = 0, tests = 0, i, cyc;

    modsub256 #(.N(256), .SLICE_W(SLICE_W)) dut (
        .clk(clk), .reset_n(reset_n), .start(start), .chain(chain),
        .x(x), .m(m), .done(done), .lt(lt), .result(result));

    always #5 clk = ~clk;

    // one single operation; returns cycles from start to done
    task run_one(input [255:0] xv, input [255:0] mv);
        reg [255:0] exp_r; reg exp_lt;
        begin
            x = xv; m = mv; start = 1; chain = 0; cyc = 0;
            @(posedge clk); #1;                   // unit has accepted start
            while (!done) begin @(posedge clk); #1; cyc = cyc + 1; end
            exp_lt = (xv < mv);
            exp_r  = (xv >= mv) ? xv - mv : xv;
            tests = tests + 1;
            if (result !== exp_r || lt !== exp_lt) begin
                errors = errors + 1;
                $display("FAIL x=%h m=%h got=%h lt=%b exp=%h lt=%b", xv, mv, result, lt, exp_r, exp_lt);
            end
            start = 0; @(posedge clk);
        end
    endtask

    function [255:0] rnd256(input integer dummy);
        begin
            rnd256 = {$random,$random,$random,$random,$random,$random,$random,$random};
        end
    endfunction

    reg [255:0] mm, r2, x_ref;
    initial begin
        x = 0; m = 1;
        repeat (3) @(posedge clk); reset_n = 1; @(posedge clk);

        // corner cases
        run_one(256'd0, 256'd1);
        run_one(256'd1, 256'd1);
        run_one(256'd5, 256'd7);
        run_one(256'd7, 256'd7);                    // X = M
        run_one(256'd6, 256'd7);                    // X = M-1
        run_one(256'd0, 256'd7);                    // X = 0
        run_one(256'd13, 256'd7);                   // X = 2M-1
        run_one(256'd83, 256'd47);                  // 0x53, 0x2F example
        run_one(256'd19, 256'd47);                  // 0x13, 0x2F example
        mm = (256'd1 << 253) + 256'd12345;          // large odd M < 2^254
        run_one(mm - 1, mm); run_one(mm, mm); run_one(2*mm - 1, mm);
        // borrow must travel across the slice boundary
        run_one({128'd1, 128'd0}, {128'd0, 128'd1});
        run_one({128'd1, 128'd0}, {128'd1, 128'd1});
        run_one({128'd5, 128'd3}, {128'd5, 128'd3});

        // random tests: arbitrary x, m  and  x close to m
        for (i = 0; i < 2000; i = i + 1) begin
            mm = rnd256(0) >> ($random & 8'h7f);  if (mm == 0) mm = 1;
            run_one(rnd256(0) >> ($random & 8'h7f), mm);
            run_one(mm + ($random % 4), mm);
            run_one(mm - ($random & 3), mm);
        end
        $display("single ops: %0d cycles after the start cycle (%0d slices + done)", cyc+1, 256/SLICE_W);

        // chain test: 20 chained doublings of x vs reference
        mm = (256'd1 << 253) + 256'd999; x_ref = 1; x = 2; m = mm;       // x = 2*current value (doubling)
        start = 1; chain = 1; cyc = 0;
        @(posedge clk); #1;
        for (i = 0; i < 20; i = i + 1) begin
            while (!done) begin @(posedge clk); #1; cyc = cyc + 1; end
            x_ref = (x_ref*2 >= mm) ? x_ref*2 - mm : x_ref*2;
            tests = tests + 1;
            if (result !== x_ref) begin errors = errors + 1; $display("CHAIN FAIL %0d", i); end
            if (i == 18) chain = 0;                  // last op: no chaining
            x = result << 1;                         // new x (doubled) is applied at the next clock edge
            @(posedge clk); #1;
            if (i == 19) start = 0;
        end
        $display("TB modsub256 SLICE_W=%0d: %0d tests, %0d errors -> %s", SLICE_W, tests, errors,
                 errors==0 ? "PASS" : "FAIL");
        $finish;
    end
    initial begin #50000000; $display("TIMEOUT"); $finish; end
endmodule