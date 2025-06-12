use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint::{ProgramResult, entrypoint},
    instruction::{AccountMeta, Instruction},
    msg,
    program::invoke,
    program_error::ProgramError,
    pubkey::Pubkey,
};

entrypoint!(proceess_instruction);

fn proceess_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    msg!("Inside cpi program");
    let mut iter = accounts.iter();

    let data_account = next_account_info(&mut iter)?;

    let counter_countract_address = next_account_info(&mut iter)?;
    let admin_account = next_account_info(&mut iter)?;

    msg!(
        "Counter contract address: {:?}, \n DAta account address: {:?}, \n Admin account address: {:?}",
        counter_countract_address.key,
        data_account.key,
        admin_account.key
    );
    if data_account.owner != counter_countract_address.key || !data_account.is_writable {
        return Err(ProgramError::InvalidAccountOwner);
    }

    let ix = Instruction {
        program_id: *counter_countract_address.key,
        accounts: vec![
            AccountMeta {
                is_signer: true,
                is_writable: false,
                pubkey: *admin_account.key,
            },
            AccountMeta {
                is_signer: false,
                is_writable: true,
                pubkey: *data_account.key,
            },
        ],
        data: vec![],
    };
    invoke(&ix, &[admin_account.clone(), data_account.clone()])?;
    Ok(())
}
