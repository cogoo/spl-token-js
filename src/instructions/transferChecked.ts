import { struct, u8 } from '@solana/buffer-layout';
import { u64 } from '@solana/buffer-layout-utils';
import { AccountMeta, PublicKey, Signer, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants';
import {
    TokenInvalidInstructionDataError,
    TokenInvalidInstructionKeysError,
    TokenInvalidInstructionProgramError,
    TokenInvalidInstructionTypeError,
} from '../errors';
import { addSigners } from './internal';
import { TokenInstruction } from './types';

/** TODO: docs */
export interface TransferCheckedInstructionData {
    instruction: TokenInstruction.TransferChecked;
    amount: bigint;
    decimals: number;
}

/** TODO: docs */
export const transferCheckedInstructionData = struct<TransferCheckedInstructionData>([
    u8('instruction'),
    u64('amount'),
    u8('decimals'),
]);

/**
 * Construct a TransferChecked instruction
 *
 * @param source       Source account
 * @param mint         Mint account
 * @param destination  Destination account
 * @param owner        Owner of the source account
 * @param amount       Number of tokens to transfer
 * @param decimals     Number of decimals in transfer amount
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createTransferCheckedInstruction(
    source: PublicKey,
    mint: PublicKey,
    destination: PublicKey,
    owner: PublicKey,
    amount: number | bigint,
    decimals: number,
    multiSigners: Signer[] = [],
    programId = TOKEN_PROGRAM_ID
): TransactionInstruction {
    const keys = addSigners(
        [
            { pubkey: source, isSigner: false, isWritable: true },
            { pubkey: mint, isSigner: false, isWritable: false },
            { pubkey: destination, isSigner: false, isWritable: true },
        ],
        owner,
        multiSigners
    );

    const data = Buffer.alloc(transferCheckedInstructionData.span);
    transferCheckedInstructionData.encode(
        {
            instruction: TokenInstruction.TransferChecked,
            amount: BigInt(amount),
            decimals,
        },
        data
    );

    return new TransactionInstruction({ keys, programId, data });
}

/** TODO: docs */
export interface DecodedTransferCheckedInstruction {
    instruction: TokenInstruction.TransferChecked;
    source: AccountMeta;
    mint: AccountMeta;
    destination: AccountMeta;
    owner: AccountMeta;
    multiSigners: AccountMeta[];
    amount: bigint;
    decimals: number;
}

/**
 * Decode a TransferChecked instruction
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded instruction
 */
export function decodeTransferCheckedInstruction(
    instruction: TransactionInstruction,
    programId = TOKEN_PROGRAM_ID
): DecodedTransferCheckedInstruction {
    if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();

    const [source, mint, destination, owner, ...multiSigners] = instruction.keys;
    if (!source || !mint || !destination || !owner) throw new TokenInvalidInstructionKeysError();

    if (instruction.data.length !== transferCheckedInstructionData.span) throw new TokenInvalidInstructionTypeError();
    const data = transferCheckedInstructionData.decode(instruction.data);
    if (data.instruction !== TokenInstruction.TransferChecked) throw new TokenInvalidInstructionDataError();

    return {
        instruction: data.instruction,
        source,
        mint,
        destination,
        owner,
        multiSigners,
        amount: data.amount,
        decimals: data.decimals,
    };
}
