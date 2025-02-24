import { WardenAction } from "./warden_action";
import {
    Account,
    createPublicClient,
    createWalletClient,
    http,
    encodeFunctionData,
    encodeAbiParameters,
    parseEther,
} from "viem";
import { z } from "zod";
import { primaryChain } from "../../utils/chains";
import { KNOWN_CONTRACTS } from "../../utils/contracts/constants/known";
import { DEFAULT_EXPRESSION } from "../../utils/contracts/constants/common";

// Retrieve factory and router contract addresses from KNOWN_CONTRACTS
const orderFactoryContract = KNOWN_CONTRACTS[primaryChain.id]?.FACTORY;
const uniswapRouterContract = KNOWN_CONTRACTS[primaryChain.id]?.UNISWAP_ROUTER;

const CREATE_BASIC_ORDER_PROMPT = `This tool should be called when a user wants to create a new basic order with specific trading parameters.`;

/**
 * Input schema for create basic order action.
 */
export const CreateBasicOrderInput = z.object({
    thresholdPrice: z.string().describe("The threshold price for the order"),
    priceCondition: z
        .number()
        .describe(
            "The price condition (e.g., 0 for less than, 1 for greater than)"
        ),
    pricePair: z
        .object({
            base: z.string(),
            quote: z.string(),
        })
        .describe("The trading pair (e.g., ['ETH', 'USD'])"),
    swapAmount: z.string().describe("Amount to swap"),
    keyId: z.string().describe("The key ID for the order"),
});

/**
 * Creates a new basic order with the given parameters.
 *
 * @param account - The account creating the order.
 * @param args - The parameters for the basic order.
 * @returns A message confirming the order creation or an error message.
 */
export async function createBasicOrder(
    account: Account,
    args: z.infer<typeof CreateBasicOrderInput>
): Promise<string> {
    // Validate contract addresses
    if (!orderFactoryContract?.address) {
        throw new Error("Factory contract address not found");
    }
    if (!uniswapRouterContract?.address) {
        throw new Error("Router contract address not found");
    }
    try {
        // Set up wallet and public clients
        const walletClient = createWalletClient({
            account,
            chain: primaryChain,
            transport: http(),
        });

        const publicClient = createPublicClient({
            chain: primaryChain,
            transport: http(),
        });

        // Calculate deadline 10 minutes from now
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // current time + 600 seconds

        // Generate calldata for swapExactETHForTokens
        const swapCalldata = encodeFunctionData({
            abi: uniswapRouterContract.abi,
            functionName: "swapExactETHForTokens",
            args: [
                parseEther(args.swapAmount),
                [
                    "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" as `0x${string}`,
                    "0xE5a71132Ae99691ef35F68459aDde842118A86a5" as `0x${string}`,
                ],
                "0x6F8a3BBb85d7EF31007F7E2217678Fa4F1B9E56D" as `0x${string}`,
                deadline,
            ],
        });

        // Prepare creatorDefinedTxFields
        const creatorDefinedTxFields = {
            value: parseEther(args.swapAmount),
            chainId: BigInt(11155111),
            to: uniswapRouterContract.address as `0x${string}`,
            data: swapCalldata,
        };

        // Encode orderData (BasicOrderData struct)
        const orderDataEncoded = encodeAbiParameters(
            [
                { type: "uint256", name: "thresholdPrice" },
                { type: "uint8", name: "priceCondition" }, // Assuming PriceCondition is a uint8 enum
                {
                    type: "tuple",
                    name: "pricePair",
                    components: [
                        { type: "string", name: "base" },
                        { type: "string", name: "quote" },
                    ],
                },
            ],
            [
                BigInt(args.thresholdPrice),
                args.priceCondition,
                {
                    base: args.pricePair.base,
                    quote: args.pricePair.quote,
                },
            ]
        );

        // Prepare commonExecutionData (CommonExecutionData struct)
        const commonExecutionData = {
            creatorDefinedTxFields: creatorDefinedTxFields,
            signRequestData: {
                keyId: BigInt(args.keyId),
                analyzers: [] as readonly `0x${string}`[],
                encryptionKey: "0x" as `0x${string}`,
                spaceNonce: BigInt(2),
                actionTimeoutHeight: BigInt(1000000000),
                expectedApproveExpression: DEFAULT_EXPRESSION,
                expectedRejectExpression: DEFAULT_EXPRESSION,
            },
        };

        // Prepare maxKeychainFees array with proper structure
        const maxKeychainFees = [
            {
                denom: "WARD",
                amount: BigInt(100000000000000),
            },
        ];
        const orderType = 0; // Assuming OrderType.Basic is 0 (enum value)
        // Generate a random salt as 32-byte hex string
        const randomHex = Math.floor(
            Math.random() * Number.MAX_SAFE_INTEGER
        ).toString(16);
        const salt = `0x${randomHex.padStart(64, "0")}` as `0x${string}`;

        // Call createOrder on the factory contract
        const hash = await walletClient.writeContract({
            address: orderFactoryContract.address,
            abi: orderFactoryContract.abi,
            functionName: "createOrder",
            args: [
                orderDataEncoded,
                commonExecutionData,
                maxKeychainFees,
                orderType,
                salt,
            ],
        });

        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === "success") {
            return `Successfully created basic order with hash: ${hash}`;
        } else {
            throw new Error("Transaction failed");
        }
    } catch (error) {
        return `Error creating basic order: ${error}`;
    }
}

/**
 * Create basic order action.
 */
export class CreateBasicOrderAction
    implements WardenAction<typeof CreateBasicOrderInput>
{
    public name = "create_basic_order";
    public description = CREATE_BASIC_ORDER_PROMPT;
    public schema = CreateBasicOrderInput;
    public function = createBasicOrder;
}
