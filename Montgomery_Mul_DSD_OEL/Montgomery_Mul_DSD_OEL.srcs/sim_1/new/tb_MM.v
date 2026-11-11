`timescale 1ns / 1ps
module tb_modmul_top;
  reg clk=0, reset_n=0; always #5 clk=~clk;
  reg start=0; reg [255:0] a_in=0,b_in=0,m_in=0;
  wire busy,done,error; wire [255:0] result_out;
  integer pass_cnt=0, fail_cnt=0, t;
  modmul_top dut(.clk(clk),.reset_n(reset_n),.start(start),.a_in(a_in),.b_in(b_in),.m_in(m_in),.busy(busy),.done(done),.error(error),.result_out(result_out));
  task run(input [255:0] a, input [255:0] b, input [255:0] m, input [255:0] exp);
  begin
    @(posedge clk); a_in<=a; b_in<=b; m_in<=m; start<=1;
    @(posedge clk); start<=0;
    t=0; @(posedge clk);
    while (!done && t<200000) begin @(posedge clk); t=t+1; end
    if (!done || error || result_out!==exp) begin
      fail_cnt=fail_cnt+1;
      $display("FAIL: A=%h B=%h M=%h\n      got=%h\n      exp=%h  (err=%b cycles=%0d)",a,b,m,result_out,exp,error,t);
    end else begin
      pass_cnt=pass_cnt+1; $display("PASS #%0d  (%0d cycles)  result=%h",pass_cnt,t,result_out);
    end
  end endtask
  task run_bad(input [255:0] a, input [255:0] b, input [255:0] m);
  begin
    @(posedge clk); a_in<=a; b_in<=b; m_in<=m; start<=1;
    @(posedge clk); start<=0; repeat(3) @(posedge clk);
    if (error && done) begin pass_cnt=pass_cnt+1; $display("PASS (bad input correctly rejected)"); end
    else begin fail_cnt=fail_cnt+1; $display("FAIL: bad input not flagged M=%h",m); end
  end endtask
  initial begin
    repeat(4) @(posedge clk); reset_n=1; repeat(2) @(posedge clk);
    run(256'h1,
        256'h172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd86,
        256'h172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd87,
        256'h172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd86);
    run(256'h172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd86,
        256'h172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd86,
        256'h172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd87,
        256'h1);
    run(256'h2,
        256'h3,
        256'h172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd87,
        256'h6);
    run(256'h2000000000000000000000000000000000000000000000000000000000000000,
        256'h2000000000000000000000000000000000000000000000000000000000000000,
        256'h2000000000000000000000000000000000000000000000000000000000000001,
        256'h1);
    run(256'hffff,
        256'h10000,
        256'h10001,
        256'h2);
    run(256'h3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe,
        256'h3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd,
        256'h3fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff,
        256'h2);
    run(256'h13b36a65ba4e6c3686ff0de26a7698065aab0a377f90ade7bc38d756d0055979,
        256'h263b6c384f42b4b548a84a5b43d43188b3890644f3d4e7b37d72e4af6978770,
        256'h145b52b53ec33dd6887e840043e58844c2354e2bb7740a63c1d8fac168fb90d7,
        256'h137f15d1c73c6769d05d6ac2919276b84e4842d1204f0e52fa324167ef5f26e0);
    run(256'h1102ef5725fbab1ba70b967adf354788d4dd79d3b5834f4cecb736d877f1caf0,
        256'h141e12f0597538cbc54be01c0ef8e010faaced226972f683de11ee00366dadc0,
        256'h17493833c0a9c8beb070e38434d57084ddfa7fa4ffe9ec11c63d5f77bb3a6a07,
        256'ha9bce65f4f9850d4bb090301c21ff4a33b308c014501becedc0a6e05f740bd5);
    run(256'h29337e6853cb2d34ea5865585254b1070f63eb18aa53bdf64d,
        256'h288171a4c3d80dad424245dc03dd8ba9d4f897181304f8c31c,
        256'h612393446abe564059b9ae5c8f1fca7da27744001a6aa45fe1,
        256'h2a5b7c5efb9df807b06a2428f511b263a9b28822a1c4fad2f6);
    run(256'h1cae4e659d1a8c836bc9e141b4852afb,
        256'h9b509fbea7193cf4d9f181ea54c4c0c3,
        256'hcdebefa791f68f88f5d93c67c5bc543b,
        256'h72a2fdb1fec5b5a71942316288812c48);
    run(256'h2ecf9a4076da03a0,
        256'h19feee6c22d7bd7f,
        256'h5d8460abc7c64d55,
        256'h3e988909d7b4da26);
    run(256'h0,
        256'hee0f5e9b6770b11ffc9492cb56211ccf0a737c355e3679f5656a72a9fa71a59,
        256'h1c64878e430e07f524329a26a0cb0b17d625c18a9871d7697e4ba5945e684f97,
        256'h0);
    run_bad(256'h5, 256'h5, 256'h8000000000000000000000000000000000000000000000000000000000000001);
    run_bad(256'h5, 256'h5, 256'h100000000000000000000000000000000000000000000000000);
    run_bad(256'h7, 256'h3, 256'h5);
    $display("=========================================");
    $display("TOTAL PASS=%0d  FAIL=%0d", pass_cnt, fail_cnt);
    if (fail_cnt==0) $display("ALL TESTS PASSED"); else $display("SOME TESTS FAILED");
    $finish;
  end
endmodule