`timescale 1ns / 1ps
//======================================================================
// debounce_pulse.v : synchronize a button, ignore bounce, and output
//                    ONE clock-wide pulse per press.
//
// The (synchronized) input must stay at a new value for
// DEBOUNCE_CYCLES clocks before it is accepted.
// 100 MHz clock: 1_000_000 cycles = 10 ms.
// The pulse is produced when the press is accepted (rising edge only).
//======================================================================
module debounce_pulse #(
    parameter DEBOUNCE_CYCLES = 1_000_000
)(
    input  wire clk,
    input  wire btn_in,
    output reg  pulse
);
    wire s;
    sync2 #(.WIDTH(1)) u_sync (.clk(clk), .d(btn_in), .q(s));

    reg        stable = 1'b0;
    reg [$clog2(DEBOUNCE_CYCLES+1):0] cnt = 0;

    initial pulse = 1'b0;

    always @(posedge clk) begin
        pulse <= 1'b0;
        if (s == stable) begin
            cnt <= 0;                          // no change, restart timer
        end else begin
            cnt <= cnt + 1'b1;                 // input differs, count how long
            if (cnt == DEBOUNCE_CYCLES-1) begin
                stable <= s;                   // held long enough, accept
                cnt    <= 0;
                if (s) pulse <= 1'b1;          // press (not release) -> one pulse
            end
        end
    end
endmodule
