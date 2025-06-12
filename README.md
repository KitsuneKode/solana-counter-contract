# Solana Counter Program

This is a simple Solana program that implements a counter functionality on the Solana blockchain. The program allows for incrementing and decrementing a counter value stored in a Solana account.

## Project Structure

- `src/lib.rs`: Contains the main program logic
- `test/`: Contains test files for the program
- `cpi-contract/`: Contains Cross-Program Invocation (CPI) related code
- `Cargo.toml`: Project dependencies and configuration

## Features

- Counter state management using Solana accounts
- Support for increment and decrement operations
- Account ownership verification
- Signer validation

## Dependencies

- `solana-program`: Core Solana program library
- `borsh`: Serialization/deserialization library
- `borsh-derive`: Derive macros for Borsh serialization

## Building

To build the program:

```bash
cargo build-spf
```

## Testing

To run the tests:

```bash
bun test
```

## Program Details

The program implements a simple counter that can be:
- Incremented by a specified value
- Decremented by a specified value

The counter state is stored in a Solana account and can only be modified by authorized signers. The program verifies account ownership and signer permissions before allowing any modifications to the counter value.
    msg!("cloned: {:?}", new.owner);
