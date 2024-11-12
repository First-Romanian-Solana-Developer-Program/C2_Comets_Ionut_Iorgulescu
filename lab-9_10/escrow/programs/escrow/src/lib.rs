pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("2j9pVNQSthpLtaq5Spv8ixdLrobvWhuE1cGoiYBsNDEf");

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn make_offer(
        context: Context<MakeOffer>,
        id: u64,
        tokne_mint_amount_a: u64,
        token_mint_amount_b: u64,
    ) -> Result<()> {
        instructions::make_offer::send_user_tokens_to_vault(&context, tokne_mint_amount_a)?;
        instructions::make_offer::save_offer(context, id, token_mint_amount_b)
    }

    pub fn take_offer(context: Context<TakeOffer>) -> Result<()> {
        instructions::take_offer::send_token_b_to_vault(&context)?;
        instructions::take_offer::send_tokens_from_vault_to_user(context)
    }
}
