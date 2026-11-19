//======================================================================
// montprod.v
// ---------

module montprod(
                input wire           clk,
                input wire           reset_n,

                input wire           calculate, // kaam start krna hai uska siganl aega bahar se; phr kaam shru hoga
                output wire          ready,     // kam khtm hojae to ready hota hai system, yani bahar bana k resourcss free hogai hein -- yani kam khtm hogaya hai

                input   [7 : 0]      length,    // kitne words hein ; 1 word  = 32 bits ; word 0 = MSW (highest) ; word 7 = LSW (lowest)

                output wire [7 : 0]  opa_addr,  // core bahr address bhej kr data mangta hia, apni memory nh hai
                input wire [31 : 0]  opa_data,  // address bhej kr data ko int lerha prcess krne k liye; INPUT A

                output wire [7 : 0]  opb_addr,  // core bahr address bhej kr data mangta hia, apni memory nh hai
                input wire [31 : 0]  opb_data,  // INPUT B

                output wire [7 : 0]  opm_addr,  // core bahr address bhej kr data mangta hia, apni memory nh hai
                input wire [31 : 0]  opm_data,  // INPUT M(modulus)

                output wire [7 : 0]  result_addr,   // core bahr address bhej kr data mangta hia, apni memory nh hai
                output wire [31 : 0] result_data,   // processing k baad output ko bahar bhejega; apni memory nh hai
                output wire          result_we      // jo data or address bhej rhe wo valid hai, store krlo, bahr walon ko signal -- grbage data ya ddr nh hai
               );


  //----------------------------------------------------------------
  // Internal constant and parameter definitions.
  //----------------------------------------------------------------
  localparam DEBUG = 0;

  // FSM states; handled by montprod_ctrl_reg; declared in line 70
  localparam CTRL_IDLE           = 4'h0;
  localparam CTRL_INIT_S         = 4'h1;
  localparam CTRL_LOOP_INIT      = 4'h2;
  localparam CTRL_LOOP_ITER      = 4'h3;
  localparam CTRL_LOOP_BQ        = 4'h4;
  localparam CTRL_L_CALC_SM      = 4'h5;
  localparam CTRL_L_STALLPIPE_SM = 4'h6;
  localparam CTRL_L_CALC_SA      = 4'h7;
  localparam CTRL_L_STALLPIPE_SA = 4'h8;
  localparam CTRL_L_CALC_SDIV2   = 4'h9;
  localparam CTRL_L_STALLPIPE_D2 = 4'hA;
  localparam CTRL_L_STALLPIPE_ES = 4'hB;
  localparam CTRL_EMIT_S         = 4'hC;
  localparam CTRL_DONE           = 4'hD;

  localparam SMUX_0            = 2'h0;
  localparam SMUX_ADD_SM       = 2'h1;
  localparam SMUX_ADD_SA       = 2'h2;
  localparam SMUX_SHR          = 2'h3;

  //----------------------------------------------------------------
  // Registers including update variables and write enable.
  //----------------------------------------------------------------

  reg [07 : 0] opa_addr_reg;
  reg [07 : 0] opb_addr_reg;
  reg [07 : 0] opm_addr_reg;

  reg [07 : 0] result_addr_reg;
  reg [31 : 0] result_data_reg;

  reg          ready_reg;
  reg          ready_new;
  reg          ready_we;

  reg [3 : 0]  montprod_ctrl_reg;   // register to store currnt state value, as per the 14 states declared above 0 -> D;
  reg [3 : 0]  montprod_ctrl_new;
  reg          montprod_ctrl_we;

  reg  [1 : 0] s_mux_new;
  reg  [1 : 0] s_mux_reg;

  reg [31 : 0] s_mem_new;
  reg          s_mem_we;
  reg          s_mem_we_new;
  reg [07 : 0] s_mem_addr;
  reg [07 : 0] s_mem_wr_addr;
  wire [31 : 0] s_mem_read_data;

  reg          q; //q = (s - b * A) & 1
  reg          q_reg;
  reg          b; //b: bit of B
  reg          b_reg;

  reg [12 : 0] loop_counter;
  reg [12 : 0] loop_counter_new;
  reg [12 : 0] loop_counter_dec;
  reg [07 : 0] B_word_index; //loop counter as a word index
  reg [04 : 0] B_bit_index; //loop counter as a bit index
  reg [04 : 0] B_bit_index_reg; //loop counter as a bit index

  reg [07 : 0] word_index; //register of what word is being read
  reg [07 : 0] word_index_new; //calculation of what word to be read
  reg [07 : 0] word_index_prev; //register of what word was read previously (result address to emit)
  reg [07 : 0] length_m1;

  reg          add_carry_in_sa;
  reg          add_carry_new_sa;
  reg          add_carry_in_sm;
  reg          add_carry_new_sm;

  reg          shr_carry_in;
  reg          shr_carry_new;

  reg          reset_word_index_LSW;
  reg          reset_word_index_MSW;


  //----------------------------------------------------------------
  // Wires.
  //----------------------------------------------------------------
  reg           tmp_result_we;
  wire [31 : 0] add_result_sa;
  wire          add_carry_out_sa;
  wire [31 : 0] add_result_sm;
  wire          add_carry_out_sm;

  wire          shr_carry_out;
  wire [31 : 0] shr_adiv2;


  //----------------------------------------------------------------
  // Concurrent connectivity for ports etc.
  //----------------------------------------------------------------
  assign opa_addr    = opa_addr_reg;
  assign opb_addr    = opb_addr_reg;
  assign opm_addr    = opm_addr_reg;

  assign result_addr = result_addr_reg;
  assign result_data = result_data_reg;
  assign result_we   = tmp_result_we;

  assign ready       = ready_reg;


  //----------------------------------------------------------------
  // Instantions
  //----------------------------------------------------------------

  // s resides here; ek address pr k 32 bit ka word
  blockmem1r1w s_mem(                           
                     .clk(clk),
                     .read_addr(s_mem_addr),
                     .read_data(s_mem_read_data),
                     .wr(s_mem_we),
                     .write_addr(s_mem_wr_addr),
                     .write_data(s_mem_new)
                    );


  // perform S+A
  adder32 s_adder_sa(
    .a(s_mem_read_data),
    .b(opa_data),
    .carry_in(add_carry_in_sa),
    .sum(add_result_sa),
    .carry_out(add_carry_out_sa)
  );

  // perform S+M
  adder32 s_adder_sm(
    .a(s_mem_read_data),
    .b(opm_data),
    .carry_in(add_carry_in_sm),
    .sum(add_result_sm),
    .carry_out(add_carry_out_sm)
  );

  // word ka bit 0 carry out bn k word se niklta hai or next word mein carry in bit bn kr adder ki chain bnata hai...
  shr32 shifter(
     .a( s_mem_read_data ),
     .carry_in( shr_carry_in ),
     .adiv2( shr_adiv2 ),
     .carry_out( shr_carry_out )
  );

  always @*
    begin : s_mux   // s_mux decides k S mein likhna kia hia currently in 4 min se.. 0, s+A, s+M, ya s>>1
      case (s_mux_reg)
        SMUX_0:
          s_mem_new = 32'b0;
        SMUX_ADD_SA:
          s_mem_new = add_result_sa;
        SMUX_ADD_SM:
          s_mem_new = add_result_sm;
        SMUX_SHR:
          s_mem_new = shr_adiv2;
      endcase
      if (DEBUG)
        $display("SMUX%x: %x", s_mux_reg, s_mem_new);
    end


  //----------------------------------------------------------------
  // reg_update
  //
  // Update functionality for all registers in the core.
  // All registers are positive edge triggered with asynchronous
  // active low reset. All registers have write enable.
  //----------------------------------------------------------------
  always @ (posedge clk or negedge reset_n)
    begin : reg_update
      if (!reset_n)
        begin
          ready_reg         <= 1'b0;
          loop_counter      <= 13'h0;
          word_index        <= 8'h0;
          word_index_prev   <= 8'h0;
          add_carry_in_sa   <= 1'b0;
          add_carry_in_sm   <= 1'b0;
          shr_carry_in      <= 1'b0;
          montprod_ctrl_reg <= CTRL_IDLE;
          b_reg             <= 1'b0;
          q_reg             <= 1'b0;
          s_mux_reg         <= SMUX_0;
          s_mem_we          <= 1'b0;
          s_mem_wr_addr     <= 8'h0;
          B_bit_index_reg   <= 5'h0;
        end
      else
        begin
          if (ready_we)
            ready_reg <= ready_new;

          if (montprod_ctrl_we)
            begin
               montprod_ctrl_reg <= montprod_ctrl_new;
             end

          s_mem_wr_addr <= s_mem_addr;

          s_mem_we <= s_mem_we_new;

          word_index <= word_index_new;
          word_index_prev <= word_index;    // clk ane pr jo value reg mein hi wo prev bn gai and new value calc ho k index mein aagai

          loop_counter <= loop_counter_new;
          shr_carry_in <= shr_carry_new;
          add_carry_in_sa <= add_carry_new_sa;
          add_carry_in_sm <= add_carry_new_sm;

          B_bit_index_reg <= B_bit_index;
          q_reg <= q;
          b_reg <= b;

          s_mux_reg <= s_mux_new;
      end
    end // reg_update

  always @*
   begin : bq_process
      b = b_reg;
      q = q_reg;    // value clock pr nh badlni ho to purani hi wapis likh do
      if (montprod_ctrl_reg == CTRL_LOOP_BQ)
         begin
           b = opb_data[ B_bit_index_reg ];
           //opa_addr will point to length-1 to get A LSB.
           //s_read_addr will point to length-1
           q = s_mem_read_data[0] ^ (opa_data[0] & b);
           if (DEBUG)
             $display("s_mem_read_data: %x opa_data %x b %x q %x B_bit_index_reg %x", s_mem_read_data, opa_data, b, q, B_bit_index_reg);
        end
   end


  //----------------------------------------------------------------
  // Process for iterating the loop counter and setting related B indexes
  //----------------------------------------------------------------
  always @*
   begin : loop_counter_process
     loop_counter_new  = loop_counter;    // value clock pr nh badlni ho to purani hi wapis likh do
      length_m1        = length - 1'b1;
      loop_counter_dec = loop_counter - 1'b1;
      B_word_index     = loop_counter[12:5];
      B_bit_index      = B_bit_index_reg;

      case (montprod_ctrl_reg)
        CTRL_LOOP_INIT:
          loop_counter_new = {length, 5'b00000} - 1'b1;

        CTRL_LOOP_ITER:
          begin
            B_word_index     = loop_counter[12:5];
            B_bit_index      = 5'h1f - loop_counter[4:0];
          end

        CTRL_L_STALLPIPE_D2:
            loop_counter_new = loop_counter_dec;

        default:
          loop_counter_new = loop_counter;
      endcase
    end


  //----------------------------------------------------------------
  // prodcalc
  //----------------------------------------------------------------
  always @*
    begin : prodcalc

      case (montprod_ctrl_reg)
        CTRL_LOOP_ITER:
          //q = (s[length-1] ^ A[length-1]) & 1;
          opa_addr_reg = length_m1; // upper length_m1 = length - 1 hai, yani 8-1 = 7, so A k b se chota word set krdia, as per requirment of q, declaredd in above line in comments
                                    // inshort, ye calculate krna chah rhe k S, even hai ya odd
        default:
          opa_addr_reg = word_index; 
       endcase

       opb_addr_reg = B_word_index;     // B k liye 13 bit ka loop counter bna hoa, 5 LSBs bit no. chnage show krti hien, or upper baaqi ki bits word number change shw krti hein
       opm_addr_reg = word_index; // A and M ko same index milega or B ko alg

      case (montprod_ctrl_reg)
        CTRL_LOOP_ITER:
          s_mem_addr = length_m1; // ye calculate krna chah rhe k S, even hai ya odd; q nikalne k liye...
        default:
          s_mem_addr = word_index;
      endcase




      result_addr_reg  = word_index_prev;   // result ek cycle delay ata hai, is liye us data ka addr previous index hai
      result_data_reg  = s_mem_read_data;   // s mem se aan wala data jo result k word ko bahar bhej rha hai

      case (montprod_ctrl_reg)
        CTRL_EMIT_S:
           tmp_result_we = 1'b1;    // jb core S k output bna k derha bahar, to wrpper output write kre us k liy signal high krrahe 
        default:
           tmp_result_we = 1'b0;    // othewise signl low reh rha
      endcase


      if (reset_word_index_LSW == 1'b1)
        word_index_new = length_m1;
      else if (reset_word_index_MSW == 1'b1)
        word_index_new = 8'h0;
      else if (montprod_ctrl_reg == CTRL_L_CALC_SDIV2)
        word_index_new = word_index + 1'b1;
      else
        word_index_new = word_index - 1'b1;
    end // prodcalc


  always @*
    begin : s_writer_process
      shr_carry_new    = 1'b0;
      s_mux_new        = SMUX_0;  
      s_mem_we_new  = 1'b0;   // defaults
      
      case (montprod_ctrl_reg)
        CTRL_INIT_S:
          begin
            s_mem_we_new = 1'b1;
            s_mux_new    = SMUX_0; // write 0
          end

        CTRL_L_CALC_SM:
          begin
            //s = (s + q*M + b*A) >>> 1;, if(q==1) S+= M. Takes (1..length) cycles.
            s_mem_we_new     = q_reg;
            s_mux_new        = SMUX_ADD_SM;
          end

        CTRL_L_CALC_SA:
          begin
            //s = (s + q*M + b*A) >>> 1;, if(b==1) S+= A. Takes (1..length) cycles.
            s_mem_we_new     = b_reg;
            s_mux_new        = SMUX_ADD_SA;
          end

        CTRL_L_CALC_SDIV2:
          begin
            //s = (s + q*M + b*A) >>> 1; s>>=1.  Takes (1..length) cycles.
            s_mux_new     = SMUX_SHR;
            s_mem_we_new  = 1'b1;
          end

        default:
          begin
          end
      endcase

      add_carry_new_sa = 1'b0;
      add_carry_new_sm = 1'b0;

      case (s_mux_reg)
        SMUX_ADD_SM:
          add_carry_new_sm = add_carry_out_sm;

        SMUX_ADD_SA:
          add_carry_new_sa = add_carry_out_sa;

        SMUX_SHR:
          shr_carry_new = shr_carry_out;

        default:
          begin
          end
      endcase

    end // prodcalc


  //----------------------------------------------------------------
  // montprod_ctrl (combinational)
  //
  // Control FSM for the montgomery product calculator.
  //----------------------------------------------------------------
  always @*
    // agr current state in signals ko  change kre to in ki value ye hogi, beacaue gr wo change krengi to ye oerwrite hoaeg as because everything is woring parallely...
    begin : montprod_ctrl
      ready_new         = 1'b0;
      ready_we          = 1'b0;
      montprod_ctrl_new = CTRL_IDLE;
      montprod_ctrl_we  = 1'b0;

      reset_word_index_LSW = 1'b0;
      reset_word_index_MSW = 1'b0;

      case (montprod_ctrl_reg)
        CTRL_IDLE:
          begin
            if (calculate)
              begin
                ready_new = 1'b0;   // system is about to get busy... init state is starting... calculate is 1
                ready_we  = 1'b1;   // load ready value; from new to prev
                montprod_ctrl_new = CTRL_INIT_S;
                montprod_ctrl_we = 1'b1;    // load new control reg value from new to prev 
                reset_word_index_LSW = 1'b1;    // word_index ko LSW (word 7) pe rewind kar do
              end
            else
              begin
                ready_new = 1'b1;
                ready_we  = 1'b1;   
              end
          end

        CTRL_INIT_S:
          begin
            if (word_index == 8'h0)
              begin
                 montprod_ctrl_new = CTRL_LOOP_INIT;
                 montprod_ctrl_we = 1'b1;
              end
          end


        CTRL_LOOP_INIT:
          begin
            montprod_ctrl_new = CTRL_LOOP_ITER;
            montprod_ctrl_we  = 1'b1;
          end

        //calculate q = (s - b * A) & 1;.
        // Also abort loop if done.
        CTRL_LOOP_ITER:
          begin
            reset_word_index_LSW = 1'b1;
            montprod_ctrl_new = CTRL_LOOP_BQ;
            montprod_ctrl_we  = 1'b1;
          end

        CTRL_LOOP_BQ:
          begin
            reset_word_index_LSW = 1'b1;
            montprod_ctrl_new = CTRL_L_CALC_SM;
            montprod_ctrl_we  = 1'b1;
          end

        CTRL_L_CALC_SM:
          begin
            if (word_index == 8'h0)
              begin
                reset_word_index_LSW  = 1'b1;
                montprod_ctrl_we  = 1'b1;
                montprod_ctrl_new = CTRL_L_STALLPIPE_SM;
              end
          end

        CTRL_L_STALLPIPE_SM:
          begin
            montprod_ctrl_new = CTRL_L_CALC_SA;
            montprod_ctrl_we = 1'b1;
            reset_word_index_LSW = 1'b1;
          end

        CTRL_L_CALC_SA:
          begin
            if (word_index == 8'h0)     // last word aagaya? it is working as loop; 
              begin
                reset_word_index_LSW  = 1'b1;
                montprod_ctrl_new = CTRL_L_STALLPIPE_SA;
                montprod_ctrl_we = 1'b1;       // until the 0th word, if cond. became false, and remain in CALC_SA state, for 8 cycles
              end
          end

        CTRL_L_STALLPIPE_SA:
          begin
            montprod_ctrl_new = CTRL_L_CALC_SDIV2;
            montprod_ctrl_we = 1'b1;
            reset_word_index_MSW = 1'b1;
          end

        CTRL_L_CALC_SDIV2:
          begin
            if (word_index == length_m1)
              begin
                montprod_ctrl_new = CTRL_L_STALLPIPE_D2;
                montprod_ctrl_we = 1'b1;
                //reset_word_index = 1'b1;
              end
          end

        CTRL_L_STALLPIPE_D2:
          begin
            montprod_ctrl_new = CTRL_LOOP_ITER; //loop
            montprod_ctrl_we = 1'b1;
            reset_word_index_LSW = 1'b1;
            if (loop_counter == 0)
              begin
                montprod_ctrl_new = CTRL_L_STALLPIPE_ES;
                montprod_ctrl_we = 1'b1;
              end
          end

        CTRL_L_STALLPIPE_ES:
          begin
            montprod_ctrl_new = CTRL_EMIT_S;
            montprod_ctrl_we = 1'b1;
            //reset_word_index_LSW = 1'b1;
          end

        CTRL_EMIT_S:
           begin
             if (DEBUG)
               $display("EMIT_S word_index: %d", word_index);
             if (word_index_prev == 8'h0)
               begin
                 montprod_ctrl_new = CTRL_DONE;
                 montprod_ctrl_we  = 1'b1;
               end
           end

        CTRL_DONE:
          begin
            ready_new         = 1'b1;
            ready_we          = 1'b1;
            montprod_ctrl_new = CTRL_IDLE;
            montprod_ctrl_we  = 1'b1;
          end

        default:
          begin
          end

      endcase // case (montprod_ctrl_reg)
    end // montprod_ctrl

endmodule // montprod

//======================================================================
// EOF montprod.v
//======================================================================
