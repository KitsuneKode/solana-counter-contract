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
    msg!("Hello World Rust program entrypoint");

    let acc = next_account_info(&mut accounts.iter())?;

    if acc.owner != program_id {
        msg!("Counter account doesnot have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    let instruction_data = InstructionType::try_from_slice(_instruction_data)?;

    let mut counter_data = CounterAccount::try_from_slice(&acc.data.borrow())?;

    match instruction_data {
        InstructionType::Increment(value) => {
            counter_data.count += value;
        }

        InstructionType::Decrement(value) => {
            counter_data.count -= value;
        }
    }

    counter_data.serialize(&mut *acc.data.borrow_mut())?;

    Ok(())
}
