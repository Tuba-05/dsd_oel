`timescale 1ns / 1ps
//======================================================================
// tb_full.v : explicit testbench for modmul_top, many test cases
//
// The testbench calculates the correct answer by itself:
//      expected = (A * B) mod M        (done inside run_test)
// so no other tool is needed.
//
// Groups: 1 normal, 2 edge cases, 3 random, 4 invalid inputs
// Every test prints: inputs, expected answer, and each check.
//======================================================================
module tb_full;

  // ---------- signals connected to the design (DUT) ----------
  reg          clk = 0, reset_n = 0;
  reg          start = 0;
  reg  [255:0] a_in = 0, b_in = 0, m_in = 0;
  wire         busy, done, error;
  wire [255:0] result_out;

  modmul_top dut (.clk(clk), .reset_n(reset_n), .start(start),
                  .a_in(a_in), .b_in(b_in), .m_in(m_in),
                  .busy(busy), .done(done), .error(error),
                  .result_out(result_out));

  always #5 clk = ~clk;                  // 10 ns clock = 100 MHz

  // ---------- bookkeeping ----------
  integer cycle       = 0;               // clocks since the start pulse
  reg     counting    = 0;               // 1 = cycle counter is running
  reg     verbose     = 0;               // 1 = print every FSM state change
  integer tests_run   = 0, tests_pass = 0, tests_fail = 0;
  integer checks_pass = 0, checks_fail = 0;
  integer min_cycles  = 999999, max_cycles = 0;
  reg [3:0] prev_state = 0;

  // name of the wrapper FSM state (for printing)
  function [8*8-1:0] sname(input [3:0] s);
    case (s)
      4'd0: sname = "IDLE    ";  4'd1: sname = "R2      ";
      4'd2: sname = "LOAD    ";  4'd3: sname = "CALC    ";
      4'd4: sname = "W1      ";  4'd5: sname = "W2      ";
      4'd6: sname = "WAIT    ";  4'd7: sname = "STORE   ";
      4'd8: sname = "DONE    ";  default: sname = "UNKNOWN ";
    endcase
  endfunction

  // compare one value with its expected value and print the verdict
  task check(input [8*32-1:0] what, input [255:0] got, input [255:0] exp);
    begin
      if (got === exp) begin
        checks_pass = checks_pass + 1;
        $display("   PASS  %0s : got %0h, expected %0h", what, got, exp);
      end else begin
        checks_fail = checks_fail + 1;
        $display("   FAIL  %0s : got %0h, expected %0h  <<<<<<", what, got, exp);
      end
    end
  endtask

  // monitor: look at the signals at the FALLING clock edge (they are settled)
  always @(negedge clk) if (counting) begin
    cycle = cycle + 1;
    if (dut.state !== prev_state) begin
      if (verbose)
        $display("   [cycle %0d] state %0s -> %0s | busy=%b done=%b error=%b",
                 cycle, sname(prev_state), sname(dut.state), busy, done, error);
      prev_state = dut.state;
    end
  end

  // start pulse, exactly 1 clock wide
  task pulse_start;
    begin
      start = 1;  @(negedge clk);
      start = 0;
    end
  endtask

  // ---------- a VALID test: result must be (A*B) mod M ----------
  task run_test(input [8*32-1:0] name, input [255:0] a, input [255:0] b,
                input [255:0] m);
    reg [511:0] prod;          // A*B needs up to 512 bits
    reg [255:0] exp;           // expected answer
    integer fails_before, n;
    begin
      tests_run = tests_run + 1;
      fails_before = checks_fail;
      prod = {256'b0, a} * {256'b0, b};
      exp  = prod % {256'b0, m};
      $display("\n---- TEST %0d (valid input): %0s ----", tests_run, name);
      $display("   A        = %0h", a);
      $display("   B        = %0h", b);
      $display("   M        = %0h", m);
      $display("   expected = %0h   ((A*B) mod M, calculated by the testbench)", exp);
      a_in = a;  b_in = b;  m_in = m;
      counting = 1;  cycle = 0;  prev_state = dut.state;
      pulse_start;
      check("busy after start pulse", busy, 1);
      check("done after start pulse", done, 0);
      // n counts clocks until done is seen (200000 is only a safety limit)
      n = 0;
      while (!done && n < 200000) begin @(negedge clk); n = n + 1; end
      $display("   latency = %0d clock cycles (edge that accepts start -> edge that raises done)", n);
      check("done",       done,  1);
      check("busy",       busy,  0);
      check("error",      error, 0);
      check("result_out", result_out, exp);
      if (n < min_cycles) min_cycles = n;
      if (n > max_cycles) max_cycles = n;
      counting = 0;
      repeat (3) @(negedge clk);
      if (checks_fail == fails_before) begin
        tests_pass = tests_pass + 1;  $display("   >>> TEST %0d RESULT: PASS", tests_run);
      end else begin
        tests_fail = tests_fail + 1;  $display("   >>> TEST %0d RESULT: FAIL <<<", tests_run);
      end
    end
  endtask

  // ---------- an INVALID test: the design must raise error ----------
  task run_bad(input [8*32-1:0] name, input [255:0] a, input [255:0] b,
               input [255:0] m);
    integer fails_before, n;
    begin
      tests_run = tests_run + 1;
      fails_before = checks_fail;
      $display("\n---- TEST %0d (INVALID input): %0s ----", tests_run, name);
      $display("   A = %0h", a);
      $display("   B = %0h", b);
      $display("   M = %0h", m);
      $display("   expected: error=1, done=1, busy=0, core never starts");
      a_in = a;  b_in = b;  m_in = m;
      counting = 1;  cycle = 0;  prev_state = dut.state;
      pulse_start;
      // OPT-1: A<M / B<M are now checked by the multi-cycle unit, so 'done' comes after a few
      // cycles (not at once). Wait for done (safety limit 100 clocks), then check.
      n = 0;
      while (!done && n < 100) begin @(negedge clk); n = n + 1; end
      $display("   error reported after %0d clock cycles", n);
      repeat (2) @(negedge clk);
      check("error", error, 1);
      check("done",  done,  1);
      check("busy",  busy,  0);
      check("wrapper state stays IDLE (0)", dut.state, 0);
      counting = 0;
      repeat (3) @(negedge clk);
      if (checks_fail == fails_before) begin
        tests_pass = tests_pass + 1;  $display("   >>> TEST %0d RESULT: PASS", tests_run);
      end else begin
        tests_fail = tests_fail + 1;  $display("   >>> TEST %0d RESULT: FAIL <<<", tests_run);
      end
    end
  endtask

  // ---------- helper for the random group ----------
  integer seed = 1;            // change this number to get different random tests
  integer i, k;
  reg [255:0] ra, rb, rm;

  function [255:0] rand256(input integer dummy);   // 256 random bits
    begin
      rand256 = {$random(seed), $random(seed), $random(seed), $random(seed),
                 $random(seed), $random(seed), $random(seed), $random(seed)};
    end
  endfunction

  // ---------- main ----------
  initial begin
    $display("\n=== Reset (reset_n = 0 for 4 clocks) ===");
    repeat (4) @(negedge clk);
    reset_n = 1;
    repeat (2) @(negedge clk);

    $display("\n=== Outputs before any start (system must be idle) ===");
    check("busy before start",  busy,  0);
    check("done before start",  done,  0);
    check("error before start", error, 0);

    // ================= GROUP 1: NORMAL =================
    $display("\n################ GROUP 1: NORMAL TESTS ################");
    // Test 1 prints every FSM state and the inside values, so you can
    // follow it by hand. By hand: (3 x 5) mod 7 = 1, R mod 7 = 2, R^2 mod 7 = 4
    verbose = 1;
    run_test("3 x 5 mod 7", 256'h3, 256'h5, 256'h7);
    verbose = 0;
    $display("   Inside values of test 1 (checked by hand):");
    check("R^2 mod M  (x)",            dut.x,  4);
    check("T = A*B*R^-1 mod M (pass 0)", dut.Am, 4);

    run_test("6 x 6 mod 7", 256'h6, 256'h6, 256'h7);
    run_test("2 x 3 mod big prime",
             256'h2, 256'h3,
             256'h172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd87);
    run_test("12345 x 67890 mod 2^127-1",
             256'd12345, 256'd67890,
             256'h7fffffffffffffffffffffffffffffff);

    // ================= GROUP 2: EDGE CASES =================
    $display("\n################ GROUP 2: EDGE CASES ################");
    run_test("A = 0",           256'h0, 256'h5, 256'h7);
    run_test("B = 0",           256'h5, 256'h0, 256'h7);
    run_test("A = 1",           256'h1, 256'h6, 256'h7);
    run_test("A = B = M-1 (big M)",
             256'h172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd86,
             256'h172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd86,
             256'h172708a3e325faa633406bc44dc2a627940eee3cba6f875c2e84496e7857dd87);
    run_test("smallest odd M = 3",     256'h2, 256'h2, 256'h3);
    run_test("M = 1 (A = B = 0)",      256'h0, 256'h0, 256'h1);
    run_test("largest valid M = 2^254-1, A = B = M-1",
             256'h3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe,
             256'h3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe,
             256'h3fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
    run_test("M = 2^253+1, A = B = 2^253",
             256'h2000000000000000000000000000000000000000000000000000000000000000,
             256'h2000000000000000000000000000000000000000000000000000000000000000,
             256'h2000000000000000000000000000000000000000000000000000000000000001);

    // ================= GROUP 3: RANDOM =================
    // M is random, made odd, and shifted right by 2..250 bits so that
    // M has different sizes and is always smaller than 2^254.
    // A and B are random and reduced mod M, so A < M and B < M.
    $display("\n################ GROUP 3: RANDOM TESTS (seed = %0d) ################", seed);
    for (i = 1; i <= 20; i = i + 1) begin
      k  = 2 + ($unsigned($random(seed)) % 249);   // shift amount 2..250
      rm = rand256(0) >> k;
      rm = rm | 256'd1;                            // M must be odd
      if (rm < 3) rm = 3;
      ra = rand256(0) % rm;
      rb = rand256(0) % rm;
      run_test("random", ra, rb, rm);
    end

    // ================= GROUP 4: INVALID INPUTS =================
    $display("\n################ GROUP 4: INVALID INPUTS ################");
    run_bad("M even (A=3, B=5, M=8)",  256'h3, 256'h5, 256'h8);
    run_bad("M >= 2^254",              256'h5, 256'h5,
            256'h4000000000000000000000000000000000000000000000000000000000000001);
    run_bad("A >= M (A=7, B=3, M=5)",  256'h7, 256'h3, 256'h5);
    run_bad("B >= M (A=3, B=7, M=5)",  256'h3, 256'h7, 256'h5);

    // one more valid test after the bad ones: the design must still work
    run_test("valid test after bad inputs", 256'h3, 256'h5, 256'h7);

    // ---------- summary ----------
    $display("\n==================== SUMMARY ====================");
    $display("TESTS : run = %0d   passed = %0d   failed = %0d", tests_run, tests_pass, tests_fail);
    $display("CHECKS: passed = %0d   failed = %0d", checks_pass, checks_fail);
    $display("Latency of valid tests (clock cycles): min = %0d   max = %0d", min_cycles, max_cycles);
    if (tests_fail == 0 && checks_fail == 0) $display("ALL TESTS PASSED");
    else $display("SOME TESTS FAILED");
    $finish;
  end
endmodule