`timescale 1ns / 1ps
//======================================================================
// sync2.v : 2-flip-flop synchronizer for asynchronous inputs
//           (switches, buttons). INIT is the value held after config.
//======================================================================
module sync2 #(
    parameter WIDTH = 1,
    parameter [WIDTH-1:0] INIT = {WIDTH{1'b0}}
)(
    input  wire             clk,
    input  wire [WIDTH-1:0] d,
    output wire [WIDTH-1:0] q
);
    (* ASYNC_REG = "TRUE" *) reg [WIDTH-1:0] ff1 = INIT;
    (* ASYNC_REG = "TRUE" *) reg [WIDTH-1:0] ff2 = INIT;

    always @(posedge clk) begin
        ff1 <= d;
        ff2 <= ff1;
    end

    assign q = ff2;
endmodule
