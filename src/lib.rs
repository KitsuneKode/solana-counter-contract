use borsh::{BorshDeserialize, BorshSerialize};

use solana_program::{
    account_info::{AccountInfo, next_account_info},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshDeserialize, BorshSerialize, Debug)]
enum InstructionType {
    Increment(u32),
    Decrement(u32),
}

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct CounterAccount {
    pub count: u32,
}

entrypoint!(counter_contract);

pub fn counter_contract(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let mut iter = accounts.iter();
    let acc = next_account_info(&mut iter)?;

    if !acc.is_signer {
        msg!("Doesnot have the required signers");
        return Err(ProgramError::MissingRequiredSignature);
    }
    msg!("Counter contract program id: {:?}", program_id);
    let data_account = next_account_info(&mut iter)?;
    msg!("Data account: {:?}", data_account.owner);
    if data_account.owner != program_id {
        msg!("Counter account doesnot have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    // let instruction_data = InstructionType::try_from_slice(_instruction_data)?;

    let mut counter_data = CounterAccount::try_from_slice(&mut *data_account.data.borrow_mut())?;
    counter_data.count = 12;
    // match instruction_data {
    //     InstructionType::Increment(value) => {
    //         counter_data.count += value;
    //     }
    //
    //     InstructionType::Decrement(value) => {
    //         counter_data.count -= value;
    //     }
    // }

    counter_data.serialize(&mut *data_account.data.borrow_mut())?;

    Ok(())
}
