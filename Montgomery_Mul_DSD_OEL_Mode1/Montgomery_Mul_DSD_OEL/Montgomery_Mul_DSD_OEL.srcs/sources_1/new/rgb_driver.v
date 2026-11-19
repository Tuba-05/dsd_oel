`timescale 1ns / 1ps
//======================================================================
// rgb_driver.v : drives the two RGB LEDs of the Nexys A7 (active HIGH)
//
// LED16 (status) priority: error -> red, busy -> yellow, done -> green,
//                          else idle -> blue.
// LED17 (mode)  : mode 0 (board switches) = OFF
//                 mode 1 (virtual / VIO, nothing on the board) = YELLOW   [OEL-CHANGE 3]
//
// PWM at low duty because the RGB LEDs are very bright.
// DUTY/256 of the time ON (default 12/256 = ~5 %). Increase if too dim.
//======================================================================
module rgb_driver #(
    parameter [7:0] DUTY = 8'd12
)(
    input  wire clk,
    input  wire error,
    input  wire busy,
    input  wire done,
    input  wire mode_big,
    output wire led16_r, led16_g, led16_b,
    output wire led17_r, led17_g, led17_b
);
    reg [7:0] pwm = 8'd0;
    always @(posedge clk) pwm <= pwm + 1'b1;
    wire on = (pwm < DUTY);

    reg sr, sg, sb;     // status colour
    always @* begin
        if      (error) begin sr = 1; sg = 0; sb = 0; end   // red
        else if (busy)  begin sr = 1; sg = 1; sb = 0; end   // yellow
        else if (done)  begin sr = 0; sg = 1; sb = 0; end   // green
        else            begin sr = 0; sg = 0; sb = 1; end   // blue (idle)
    end

    assign led16_r = sr & on;
    assign led16_g = sg & on;
    assign led16_b = sb & on;

    assign led17_r =  mode_big & on;           // yellow = R+G  (mode 1)
    assign led17_g =  mode_big & on;           // mode 0: RGB17 OFF
    assign led17_b =  1'b0;
endmodule
