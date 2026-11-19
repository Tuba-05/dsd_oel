`timescale 1ns / 1ps
//======================================================================
// seg7_driver.v : 8-digit multiplexed 7-segment driver (Nexys A7)
//
// value[31:0] is shown as 8 hex digits (digit 0 = value[3:0] = rightmost).
// enable = 0 : all digits blank.
// error = 1 : show "E" on the rightmost digit, all other digits blank.
//
// Nexys A7: segments (CA..CG) and anodes (AN0..AN7) are ACTIVE LOW.
// seg[6:0] = {CG,CF,CE,CD,CC,CB,CA}
// Scan: 17-bit counter, digit changes every 2^14 clocks
//       -> each digit refreshed at 100 MHz / 2^17 = ~763 Hz.
//======================================================================
module seg7_driver (
    input  wire        clk,
    input  wire [31:0] value,
    input  wire        error,
    input  wire        enable,        // 0 = display blank (used in mode 1, virtual)   [OEL-CHANGE 4]
    output reg  [6:0]  seg,
    output reg  [7:0]  an
);
    reg [16:0] refresh = 17'd0;
    always @(posedge clk) refresh <= refresh + 1'b1;

    wire [2:0] sel = refresh[16:14];

    reg [3:0] nib;
    always @* begin
        case (sel)
            3'd0: nib = value[ 3: 0];
            3'd1: nib = value[ 7: 4];
            3'd2: nib = value[11: 8];
            3'd3: nib = value[15:12];
            3'd4: nib = value[19:16];
            3'd5: nib = value[23:20];
            3'd6: nib = value[27:24];
            default: nib = value[31:28];
        endcase
    end

    reg [6:0] pat;
    always @* begin
        if (!enable) begin
            pat = 7'b1111111;                                // all segments off
        end else if (error) begin
            pat = (sel == 3'd0) ? 7'b0000110 : 7'b1111111;   // E on digit 0, rest blank
        end else begin
            case (nib)
                4'h0: pat = 7'b1000000;
                4'h1: pat = 7'b1111001;
                4'h2: pat = 7'b0100100;
                4'h3: pat = 7'b0110000;
                4'h4: pat = 7'b0011001;
                4'h5: pat = 7'b0010010;
                4'h6: pat = 7'b0000010;
                4'h7: pat = 7'b1111000;
                4'h8: pat = 7'b0000000;
                4'h9: pat = 7'b0010000;
                4'hA: pat = 7'b0001000;
                4'hB: pat = 7'b0000011;
                4'hC: pat = 7'b1000110;
                4'hD: pat = 7'b0100001;
                4'hE: pat = 7'b0000110;
                default: pat = 7'b0001110;                    // F
            endcase
        end
    end

    initial begin seg = 7'h7F; an = 8'hFF; end

    always @(posedge clk) begin
        seg <= pat;
        an  <= ~(8'b0000_0001 << sel);
    end
endmodule
