export default (
    {
        abi: [
            {
                type: "constructor",
                inputs: [
                    {
                        name: "registry",
                        type: "address",
                        internalType: "address",
                    },
                    {
                        name: "_scheduler",
                        type: "address",
                        internalType: "address",
                    },
                    { name: "owner", type: "address", internalType: "address" },
                    {
                        name: "basicOrderFactory",
                        type: "address",
                        internalType: "address",
                    },
                    {
                        name: "advancedOrderFactory",
                        type: "address",
                        internalType: "address",
                    },
                ],
                stateMutability: "nonpayable",
            },
            {
                type: "function",
                name: "ADVANCED_ORDER_FACTORY",
                inputs: [],
                outputs: [
                    {
                        name: "",
                        type: "address",
                        internalType: "contract AdvancedOrderFactory",
                    },
                ],
                stateMutability: "view",
            },
            {
                type: "function",
                name: "BASIC_ORDER_FACTORY",
                inputs: [],
                outputs: [
                    {
                        name: "",
                        type: "address",
                        internalType: "contract BasicOrderFactory",
                    },
                ],
                stateMutability: "view",
            },
            {
                type: "function",
                name: "REGISTRY",
                inputs: [],
                outputs: [
                    {
                        name: "",
                        type: "address",
                        internalType: "contract Registry",
                    },
                ],
                stateMutability: "view",
            },
            {
                type: "function",
                name: "computeOrderAddress",
                inputs: [
                    {
                        name: "origin",
                        type: "address",
                        internalType: "address",
                    },
                    { name: "salt", type: "bytes32", internalType: "bytes32" },
                    {
                        name: "orderType",
                        type: "uint8",
                        internalType: "enum OrderType",
                    },
                ],
                outputs: [
                    { name: "order", type: "address", internalType: "address" },
                ],
                stateMutability: "view",
            },
            {
                type: "function",
                name: "createOrder",
                inputs: [
                    {
                        name: "_orderData",
                        type: "bytes",
                        internalType: "bytes",
                    },
                    {
                        name: "_executionData",
                        type: "tuple",
                        internalType: "struct Types.CommonExecutionData",
                        components: [
                            {
                                name: "creatorDefinedTxFields",
                                type: "tuple",
                                internalType:
                                    "struct Types.CreatorDefinedTxFields",
                                components: [
                                    {
                                        name: "value",
                                        type: "uint256",
                                        internalType: "uint256",
                                    },
                                    {
                                        name: "chainId",
                                        type: "uint256",
                                        internalType: "uint256",
                                    },
                                    {
                                        name: "to",
                                        type: "address",
                                        internalType: "address",
                                    },
                                    {
                                        name: "data",
                                        type: "bytes",
                                        internalType: "bytes",
                                    },
                                ],
                            },
                            {
                                name: "signRequestData",
                                type: "tuple",
                                internalType: "struct Types.SignRequestData",
                                components: [
                                    {
                                        name: "keyId",
                                        type: "uint64",
                                        internalType: "uint64",
                                    },
                                    {
                                        name: "analyzers",
                                        type: "bytes[]",
                                        internalType: "bytes[]",
                                    },
                                    {
                                        name: "encryptionKey",
                                        type: "bytes",
                                        internalType: "bytes",
                                    },
                                    {
                                        name: "spaceNonce",
                                        type: "uint64",
                                        internalType: "uint64",
                                    },
                                    {
                                        name: "actionTimeoutHeight",
                                        type: "uint64",
                                        internalType: "uint64",
                                    },
                                    {
                                        name: "expectedApproveExpression",
                                        type: "string",
                                        internalType: "string",
                                    },
                                    {
                                        name: "expectedRejectExpression",
                                        type: "string",
                                        internalType: "string",
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        name: "maxKeychainFees",
                        type: "tuple[]",
                        internalType: "struct Types.Coin[]",
                        components: [
                            {
                                name: "denom",
                                type: "string",
                                internalType: "string",
                            },
                            {
                                name: "amount",
                                type: "uint256",
                                internalType: "uint256",
                            },
                        ],
                    },
                    {
                        name: "orderType",
                        type: "uint8",
                        internalType: "enum OrderType",
                    },
                    { name: "salt", type: "bytes32", internalType: "bytes32" },
                ],
                outputs: [
                    { name: "order", type: "address", internalType: "address" },
                ],
                stateMutability: "nonpayable",
            },
            {
                type: "function",
                name: "orders",
                inputs: [
                    {
                        name: "orderAddress",
                        type: "address",
                        internalType: "address",
                    },
                ],
                outputs: [
                    {
                        name: "orderCreator",
                        type: "address",
                        internalType: "address",
                    },
                ],
                stateMutability: "view",
            },
            {
                type: "function",
                name: "owner",
                inputs: [],
                outputs: [
                    { name: "", type: "address", internalType: "address" },
                ],
                stateMutability: "view",
            },
            {
                type: "function",
                name: "renounceOwnership",
                inputs: [],
                outputs: [],
                stateMutability: "nonpayable",
            },
            {
                type: "function",
                name: "scheduler",
                inputs: [],
                outputs: [
                    { name: "", type: "address", internalType: "address" },
                ],
                stateMutability: "view",
            },
            {
                type: "function",
                name: "setScheduler",
                inputs: [
                    {
                        name: "_scheduler",
                        type: "address",
                        internalType: "address",
                    },
                ],
                outputs: [],
                stateMutability: "nonpayable",
            },
            {
                type: "function",
                name: "transferOwnership",
                inputs: [
                    {
                        name: "newOwner",
                        type: "address",
                        internalType: "address",
                    },
                ],
                outputs: [],
                stateMutability: "nonpayable",
            },
            {
                type: "event",
                name: "OrderCreated",
                inputs: [
                    {
                        name: "orderCreator",
                        type: "address",
                        indexed: true,
                        internalType: "address",
                    },
                    {
                        name: "orderType",
                        type: "uint8",
                        indexed: true,
                        internalType: "enum OrderType",
                    },
                    {
                        name: "orderContract",
                        type: "address",
                        indexed: true,
                        internalType: "address",
                    },
                ],
                anonymous: false,
            },
            {
                type: "event",
                name: "OwnershipTransferred",
                inputs: [
                    {
                        name: "previousOwner",
                        type: "address",
                        indexed: true,
                        internalType: "address",
                    },
                    {
                        name: "newOwner",
                        type: "address",
                        indexed: true,
                        internalType: "address",
                    },
                ],
                anonymous: false,
            },
            {
                type: "event",
                name: "SchedulerChanged",
                inputs: [
                    {
                        name: "oldScheduler",
                        type: "address",
                        indexed: true,
                        internalType: "address",
                    },
                    {
                        name: "newScheduler",
                        type: "address",
                        indexed: true,
                        internalType: "address",
                    },
                ],
                anonymous: false,
            },
            { type: "error", name: "InvalidRegistryAddress", inputs: [] },
            { type: "error", name: "InvalidSchedulerAddress", inputs: [] },
            {
                type: "error",
                name: "OwnableInvalidOwner",
                inputs: [
                    { name: "owner", type: "address", internalType: "address" },
                ],
            },
            {
                type: "error",
                name: "OwnableUnauthorizedAccount",
                inputs: [
                    {
                        name: "account",
                        type: "address",
                        internalType: "address",
                    },
                ],
            },
            { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
            { type: "error", name: "UnsupportedOrder", inputs: [] },
        ],
        bytecode: {
            object: "0x60e03461017a57601f61146c38819003918201601f191683019291906001600160401b0384118385101761017f578160a0928492604096875283398101031261017a5761004b81610195565b9061005860208201610195565b90610064848201610195565b9061007d608061007660608401610195565b9201610195565b6001600160a01b0392831693909190841561016257836000549660018060a01b03199680888a1617600055828a5199167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0600080a3600180551695861561015357508316948515610142579083916080521660a0521660c0526003541617600355516112c290816101aa823960805181610c67015260a0518181816102440152818161048c015261082d015260c05181818161034f015281816104070152610b1e0152f35b8651637d8ed95960e11b8152600490fd5b637bfd2e8360e01b8152600490fd5b8651631e4fbdf760e01b815260006004820152602490fd5b600080fd5b634e487b7160e01b600052604160045260246000fd5b51906001600160a01b038216820361017a5756fe608080604052600436101561001357600080fd5b60003560e01c90816306433b1b14610c3c5750806315a96ae9146105eb5780633f6746ce1461052e578063715018a6146104b057806372bdda541461045f5780638da5cb5b1461042b578063aa638107146103da578063d1ad17bf146103a6578063f04e5bed146101a9578063f2fde38b146100e55763f40e84711461009857600080fd5b346100e05760206003193601126100e057602073ffffffffffffffffffffffffffffffffffffffff806100c9610c8b565b166000526002825260406000205416604051908152f35b600080fd5b346100e05760206003193601126100e0576100fe610c8b565b610106611264565b73ffffffffffffffffffffffffffffffffffffffff80911690811561017857600054827fffffffffffffffffffffffff0000000000000000000000000000000000000000821617600055167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0600080a3005b60246040517f1e4fbdf700000000000000000000000000000000000000000000000000000000815260006004820152fd5b346100e05760606003193601126100e0576101c2610c8b565b60243560443560028110156100e057600090806102d05750506040517f7fddd60200000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff909216600483015260248201526020818060448101038173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000165afa80156102c457602091600091610297575b505b73ffffffffffffffffffffffffffffffffffffffff60405191168152f35b6102b79150823d84116102bd575b6102af8183610cae565b810190610dc7565b82610277565b503d6102a5565b6040513d6000823e3d90fd5b9091906001146102e5575b5060209150610279565b6040517f7fddd60200000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff90931660048401526024830152506020818060448101038173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000165afa80156102c457602091600091610389575b50826102db565b6103a09150823d84116102bd576102af8183610cae565b82610382565b346100e05760006003193601126100e057602073ffffffffffffffffffffffffffffffffffffffff60035416604051908152f35b346100e05760006003193601126100e057602060405173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000168152f35b346100e05760006003193601126100e057602073ffffffffffffffffffffffffffffffffffffffff60005416604051908152f35b346100e05760006003193601126100e057602060405173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000168152f35b346100e05760006003193601126100e0576104c9611264565b600073ffffffffffffffffffffffffffffffffffffffff81547fffffffffffffffffffffffff000000000000000000000000000000000000000081168355167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a3005b346100e05760206003193601126100e057610547610c8b565b61054f611264565b73ffffffffffffffffffffffffffffffffffffffff8091169081156105c157600354827fffffffffffffffffffffffff0000000000000000000000000000000000000000821617600355167fd8a42eaab83c563642705bc71a5905c29682aa5bf997aaa24b2ff7b3f32ed0b6600080a3005b60046040517ffb1db2b2000000000000000000000000000000000000000000000000000000008152fd5b346100e05760a06003193601126100e05767ffffffffffffffff600435116100e0573660236004350112156100e0576004356004013567ffffffffffffffff81116100e057366024826004350101116100e05760243567ffffffffffffffff81116100e057604060031982360301126100e05760443567ffffffffffffffff81116100e057366023820112156100e05767ffffffffffffffff8160040135116100e057366024826004013560051b830101116100e057600260643510156100e057600260015414610c125760026001556064356109355760209081600435856004350103126100e0576024600435013567ffffffffffffffff81116100e0576004350190606082866004350103126100e0576040516060810181811067ffffffffffffffff821117610906576040526024830135815260448301359160048310156100e05784820192835260648401359667ffffffffffffffff88116100e057610768869560246107d59a81610818956004350101920101610d64565b91604084019283526107fd73ffffffffffffffffffffffffffffffffffffffff986107e88a60035416956040519c8d998a997f3dc48a34000000000000000000000000000000000000000000000000000000008b5260a060048c01525160a48b01525160c48a0190610e7e565b51606060e4890152610104880190610e51565b90600319878303016024880152600401610f5e565b90600319858303016044860152602481600401359101611198565b906064830152608435608483015203816000867f0000000000000000000000000000000000000000000000000000000000000000165af19182156102c4576020936000936108e4575b5060029083169182600052526040600020337fffffffffffffffffffffffff00000000000000000000000000000000000000008254161790556000337f08e9a1418653bd72d79048c016f319d58d60c2615929361e4c38adc69265c4c88280a45b6001805573ffffffffffffffffffffffffffffffffffffffff60405191168152f35b60029193506108ff90833d85116102bd576102af8183610cae565b9290610861565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b91606435600103610be857602060043582810103126100e0576024600435013567ffffffffffffffff81116100e057600435019160a083836004350103126100e0576040519160a0830183811067ffffffffffffffff82111761090657604052602484013567ffffffffffffffff81116100e0576109bf9060248084600435010191870101610d64565b8352604484013567ffffffffffffffff81116100e0576024806109ea93600435010191860101610d64565b602083015260648301359360048510156100e05760a46020946107fd9660408601526084810135606086015201356080840152610af573ffffffffffffffffffffffffffffffffffffffff600354169160405196879586957f4cd33ddc00000000000000000000000000000000000000000000000000000000875260a060048801526080610abb610a88845160a060a48c01526101448b0190610e51565b8b8501517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff5c8b83030160c48c0152610e51565b92610ace604082015160e48b0190610e7e565b60608101516101048a01520151610124880152600319878303016024880152600401610f5e565b90606483015260843560848301520381600073ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000165af180156102c457602091600091610bcb575b5073ffffffffffffffffffffffffffffffffffffffff811680600052600283526040600020337fffffffffffffffffffffffff00000000000000000000000000000000000000008254161790556001337f08e9a1418653bd72d79048c016f319d58d60c2615929361e4c38adc69265c4c8600080a46108c2565b610be29150823d84116102bd576102af8183610cae565b82610b51565b60046040517fa3c0e0d1000000000000000000000000000000000000000000000000000000008152fd5b60046040517f3ee5aeb5000000000000000000000000000000000000000000000000000000008152fd5b346100e05760006003193601126100e05760209073ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000168152f35b6004359073ffffffffffffffffffffffffffffffffffffffff821682036100e057565b90601f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0910116810190811067ffffffffffffffff82111761090657604052565b81601f820112156100e05780359067ffffffffffffffff82116109065760405192610d4260207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8601160185610cae565b828452602083830101116100e057816000926020809301838601378301015290565b9190916040818403126100e057604080519167ffffffffffffffff9183018281118482101761090657604052829481358381116100e05781610da7918401610cef565b845260208201359283116100e057602092610dc29201610cef565b910152565b908160209103126100e0575173ffffffffffffffffffffffffffffffffffffffff811681036100e05790565b919082519283825260005b848110610e3d5750507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8460006020809697860101520116010190565b602081830181015184830182015201610dfe565b610e7b916020610e6a8351604084526040840190610df3565b920151906020818403910152610df3565b90565b906004821015610e8b5752565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b90357fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe1823603018112156100e057016020813591019167ffffffffffffffff82116100e05781360383136100e057565b601f82602094937fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0938186528686013760008582860101520116010190565b359067ffffffffffffffff821682036100e057565b91908235833603907fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8182018112156100e0578401936040835284356040840152602094858101356060850152604081013573ffffffffffffffffffffffffffffffffffffffff81168091036100e057610ff591610fe49160808701526060810190610eba565b608060a087015260c0860191610f0a565b917fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff218683013591018112156100e05701918481830391015260e0810167ffffffffffffffff948561104585610f49565b168352808401357fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe1853603018112156100e0578401908082359201928783116100e0578260051b9081360385136100e05760e0868401528390528401610100908101939291906000908601845b8483106111435750505050505061112a610e7b94956110e9611135936110db6040880188610eba565b908783036040890152610f0a565b90806110f760608801610f49565b16606086015261110960808701610f49565b16608085015261111c60a0860186610eba565b9085830360a0870152610f0a565b9260c0810190610eba565b9160c0818503910152610f0a565b9091929394958480611188837fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff008c600196030187526111828b87610eba565b90610f0a565b98019301930191949392906110b2565b90918092808252602080920191808260051b8601019484600080925b8584106111c657505050505050505090565b90919293949596977fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe082820301885288357fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc18536030181121561126057866001928682930190828061124a604061123d8680610eba565b9091808752860191610f0a565b9301359101529a019801969594019291906111b4565b8380fd5b73ffffffffffffffffffffffffffffffffffffffff60005416330361128557565b60246040517f118cdaa7000000000000000000000000000000000000000000000000000000008152336004820152fdfea164736f6c6343000819000a",
            sourceMap:
                "989:5618:17:-:0;;;;;;;;;;;;;-1:-1:-1;;989:5618:17;;;;;;-1:-1:-1;;;;;989:5618:17;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;:::i;:::-;;;;;;;:::i;:::-;;;;;;;;;:::i;:::-;;;;:::i;:::-;-1:-1:-1;;;;;989:5618:17;;;;;;;1273:26:6;;1269:95;;989:5618:17;-1:-1:-1;989:5618:17;;;;;;;;;;;;;;-1:-1:-1;989:5618:17;;;;;;3052:40:6;-1:-1:-1;3052:40:6;;1857:1:8;;;989:5618:17;1716:22;;;1712:84;;989:5618;;;1810:24;;;1806:87;;1903:29;;;989:5618;1903:29;989:5618;;1942:58;989:5618;2010:67;;2087:22;989:5618;;;2087:22;989:5618;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2010:67;989:5618;;;;;;;;;;;;;;;;1806:87;989:5618;;-1:-1:-1;;;1857:25:17;;;;;1712:84;-1:-1:-1;;;1761:24:17;;;;;1269:95:6;989:5618:17;;-1:-1:-1;;;1322:31:6;;-1:-1:-1;1322:31:6;;;989:5618:17;;;1322:31:6;989:5618:17;-1:-1:-1;989:5618:17;;;;;;-1:-1:-1;989:5618:17;;;;;-1:-1:-1;989:5618:17;;;;-1:-1:-1;;;;;989:5618:17;;;;;;:::o",
            linkReferences: {},
        },
        deployedBytecode: {
            object: "0x608080604052600436101561001357600080fd5b60003560e01c90816306433b1b14610c3c5750806315a96ae9146105eb5780633f6746ce1461052e578063715018a6146104b057806372bdda541461045f5780638da5cb5b1461042b578063aa638107146103da578063d1ad17bf146103a6578063f04e5bed146101a9578063f2fde38b146100e55763f40e84711461009857600080fd5b346100e05760206003193601126100e057602073ffffffffffffffffffffffffffffffffffffffff806100c9610c8b565b166000526002825260406000205416604051908152f35b600080fd5b346100e05760206003193601126100e0576100fe610c8b565b610106611264565b73ffffffffffffffffffffffffffffffffffffffff80911690811561017857600054827fffffffffffffffffffffffff0000000000000000000000000000000000000000821617600055167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0600080a3005b60246040517f1e4fbdf700000000000000000000000000000000000000000000000000000000815260006004820152fd5b346100e05760606003193601126100e0576101c2610c8b565b60243560443560028110156100e057600090806102d05750506040517f7fddd60200000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff909216600483015260248201526020818060448101038173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000165afa80156102c457602091600091610297575b505b73ffffffffffffffffffffffffffffffffffffffff60405191168152f35b6102b79150823d84116102bd575b6102af8183610cae565b810190610dc7565b82610277565b503d6102a5565b6040513d6000823e3d90fd5b9091906001146102e5575b5060209150610279565b6040517f7fddd60200000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff90931660048401526024830152506020818060448101038173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000165afa80156102c457602091600091610389575b50826102db565b6103a09150823d84116102bd576102af8183610cae565b82610382565b346100e05760006003193601126100e057602073ffffffffffffffffffffffffffffffffffffffff60035416604051908152f35b346100e05760006003193601126100e057602060405173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000168152f35b346100e05760006003193601126100e057602073ffffffffffffffffffffffffffffffffffffffff60005416604051908152f35b346100e05760006003193601126100e057602060405173ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000168152f35b346100e05760006003193601126100e0576104c9611264565b600073ffffffffffffffffffffffffffffffffffffffff81547fffffffffffffffffffffffff000000000000000000000000000000000000000081168355167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e08280a3005b346100e05760206003193601126100e057610547610c8b565b61054f611264565b73ffffffffffffffffffffffffffffffffffffffff8091169081156105c157600354827fffffffffffffffffffffffff0000000000000000000000000000000000000000821617600355167fd8a42eaab83c563642705bc71a5905c29682aa5bf997aaa24b2ff7b3f32ed0b6600080a3005b60046040517ffb1db2b2000000000000000000000000000000000000000000000000000000008152fd5b346100e05760a06003193601126100e05767ffffffffffffffff600435116100e0573660236004350112156100e0576004356004013567ffffffffffffffff81116100e057366024826004350101116100e05760243567ffffffffffffffff81116100e057604060031982360301126100e05760443567ffffffffffffffff81116100e057366023820112156100e05767ffffffffffffffff8160040135116100e057366024826004013560051b830101116100e057600260643510156100e057600260015414610c125760026001556064356109355760209081600435856004350103126100e0576024600435013567ffffffffffffffff81116100e0576004350190606082866004350103126100e0576040516060810181811067ffffffffffffffff821117610906576040526024830135815260448301359160048310156100e05784820192835260648401359667ffffffffffffffff88116100e057610768869560246107d59a81610818956004350101920101610d64565b91604084019283526107fd73ffffffffffffffffffffffffffffffffffffffff986107e88a60035416956040519c8d998a997f3dc48a34000000000000000000000000000000000000000000000000000000008b5260a060048c01525160a48b01525160c48a0190610e7e565b51606060e4890152610104880190610e51565b90600319878303016024880152600401610f5e565b90600319858303016044860152602481600401359101611198565b906064830152608435608483015203816000867f0000000000000000000000000000000000000000000000000000000000000000165af19182156102c4576020936000936108e4575b5060029083169182600052526040600020337fffffffffffffffffffffffff00000000000000000000000000000000000000008254161790556000337f08e9a1418653bd72d79048c016f319d58d60c2615929361e4c38adc69265c4c88280a45b6001805573ffffffffffffffffffffffffffffffffffffffff60405191168152f35b60029193506108ff90833d85116102bd576102af8183610cae565b9290610861565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b91606435600103610be857602060043582810103126100e0576024600435013567ffffffffffffffff81116100e057600435019160a083836004350103126100e0576040519160a0830183811067ffffffffffffffff82111761090657604052602484013567ffffffffffffffff81116100e0576109bf9060248084600435010191870101610d64565b8352604484013567ffffffffffffffff81116100e0576024806109ea93600435010191860101610d64565b602083015260648301359360048510156100e05760a46020946107fd9660408601526084810135606086015201356080840152610af573ffffffffffffffffffffffffffffffffffffffff600354169160405196879586957f4cd33ddc00000000000000000000000000000000000000000000000000000000875260a060048801526080610abb610a88845160a060a48c01526101448b0190610e51565b8b8501517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff5c8b83030160c48c0152610e51565b92610ace604082015160e48b0190610e7e565b60608101516101048a01520151610124880152600319878303016024880152600401610f5e565b90606483015260843560848301520381600073ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000165af180156102c457602091600091610bcb575b5073ffffffffffffffffffffffffffffffffffffffff811680600052600283526040600020337fffffffffffffffffffffffff00000000000000000000000000000000000000008254161790556001337f08e9a1418653bd72d79048c016f319d58d60c2615929361e4c38adc69265c4c8600080a46108c2565b610be29150823d84116102bd576102af8183610cae565b82610b51565b60046040517fa3c0e0d1000000000000000000000000000000000000000000000000000000008152fd5b60046040517f3ee5aeb5000000000000000000000000000000000000000000000000000000008152fd5b346100e05760006003193601126100e05760209073ffffffffffffffffffffffffffffffffffffffff7f0000000000000000000000000000000000000000000000000000000000000000168152f35b6004359073ffffffffffffffffffffffffffffffffffffffff821682036100e057565b90601f7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0910116810190811067ffffffffffffffff82111761090657604052565b81601f820112156100e05780359067ffffffffffffffff82116109065760405192610d4260207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8601160185610cae565b828452602083830101116100e057816000926020809301838601378301015290565b9190916040818403126100e057604080519167ffffffffffffffff9183018281118482101761090657604052829481358381116100e05781610da7918401610cef565b845260208201359283116100e057602092610dc29201610cef565b910152565b908160209103126100e0575173ffffffffffffffffffffffffffffffffffffffff811681036100e05790565b919082519283825260005b848110610e3d5750507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8460006020809697860101520116010190565b602081830181015184830182015201610dfe565b610e7b916020610e6a8351604084526040840190610df3565b920151906020818403910152610df3565b90565b906004821015610e8b5752565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b90357fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe1823603018112156100e057016020813591019167ffffffffffffffff82116100e05781360383136100e057565b601f82602094937fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0938186528686013760008582860101520116010190565b359067ffffffffffffffff821682036100e057565b91908235833603907fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8182018112156100e0578401936040835284356040840152602094858101356060850152604081013573ffffffffffffffffffffffffffffffffffffffff81168091036100e057610ff591610fe49160808701526060810190610eba565b608060a087015260c0860191610f0a565b917fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff218683013591018112156100e05701918481830391015260e0810167ffffffffffffffff948561104585610f49565b168352808401357fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe1853603018112156100e0578401908082359201928783116100e0578260051b9081360385136100e05760e0868401528390528401610100908101939291906000908601845b8483106111435750505050505061112a610e7b94956110e9611135936110db6040880188610eba565b908783036040890152610f0a565b90806110f760608801610f49565b16606086015261110960808701610f49565b16608085015261111c60a0860186610eba565b9085830360a0870152610f0a565b9260c0810190610eba565b9160c0818503910152610f0a565b9091929394958480611188837fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff008c600196030187526111828b87610eba565b90610f0a565b98019301930191949392906110b2565b90918092808252602080920191808260051b8601019484600080925b8584106111c657505050505050505090565b90919293949596977fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe082820301885288357fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc18536030181121561126057866001928682930190828061124a604061123d8680610eba565b9091808752860191610f0a565b9301359101529a019801969594019291906111b4565b8380fd5b73ffffffffffffffffffffffffffffffffffffffff60005416330361128557565b60246040517f118cdaa7000000000000000000000000000000000000000000000000000000008152336004820152fdfea164736f6c6343000819000a",
            sourceMap:
                "989:5618:17:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;-1:-1:-1;;989:5618:17;;;;;;;;;;:::i;:::-;;;;1097:67;989:5618;;;;;;;;;;;;;;;;;;;;;;-1:-1:-1;;989:5618:17;;;;;;;:::i;:::-;1500:62:6;;:::i;:::-;989:5618:17;;;;2627:22:6;;;2623:91;;989:5618:17;;;;;;;;;;3052:40:6;989:5618:17;3052:40:6;;989:5618:17;2623:91:6;989:5618:17;;;2672:31:6;;;989:5618:17;;2672:31:6;;989:5618:17;2672:31:6;989:5618:17;;;;;-1:-1:-1;;989:5618:17;;;;;;;:::i;:::-;;;;;;;;;;;;;2574:28;;;-1:-1:-1;;989:5618:17;;;2626:53;;989:5618;;;;;2626:53;;989:5618;;;;;;;;;;;2626:53;:19;989:5618;2626:19;989:5618;2626:53;;;;;;989:5618;2626:53;989:5618;2626:53;;;2570:252;2618:61;2570:252;989:5618;;;;;;;;2626:53;;;;;;;;;;;;;;;:::i;:::-;;;;;:::i;:::-;;;;;;;;;;989:5618;;;;;;;;;2570:252;2700:31;;;989:5618;2700:31;2696:126;;2570:252;;989:5618;2570:252;;;;2696:126;989:5618;;;2755:56;;989:5618;;;;;2755:56;;989:5618;;;;;-1:-1:-1;989:5618:17;;;;;;2755:56;:22;989:5618;2755:22;989:5618;2755:56;;;;;;989:5618;2755:56;989:5618;2755:56;;;2696:126;2747:64;2696:126;;;2755:56;;;;;;;;;;;;;;:::i;:::-;;;;989:5618;;;;;-1:-1:-1;;989:5618:17;;;;;;;1476:24;989:5618;;;;;;;;;;;;;-1:-1:-1;;989:5618:17;;;;;;;;;1384:60;989:5618;;;;;;;;;-1:-1:-1;;989:5618:17;;;;;;;;;;;;;;;;;;;;;-1:-1:-1;;989:5618:17;;;;;;;;;1286:54;989:5618;;;;;;;;;-1:-1:-1;;989:5618:17;;;;;1500:62:6;;:::i;:::-;989:5618:17;;;;;;;;;;3052:40:6;;;;989:5618:17;;;;;;-1:-1:-1;;989:5618:17;;;;;;;:::i;:::-;1500:62:6;;:::i;:::-;989:5618:17;;;;4307:24;;;4303:87;;4422:9;989:5618;;;;;;4422:9;989:5618;;4478:41;989:5618;4478:41;;989:5618;4303:87;989:5618;;;4354:25;;;;989:5618;;;;;-1:-1:-1;;989:5618:17;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;-1:-1:-1;;989:5618:17;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2702:18:8;2698:86;;989:5618:17;;1899:1:8;989:5618:17;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;3752:9;989:5618;;;;;5304:99;;;;;989:5618;5304:99;;989:5618;;5304:99;;989:5618;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;:::i;:::-;;-1:-1:-1;;989:5618:17;;;;;;;;;;;:::i;:::-;;-1:-1:-1;;989:5618:17;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;5304:99;:19;989:5618;5304:19;;989:5618;5304:99;;;;;;;989:5618;5304:99;989:5618;5304:99;;;3518:590;989:5618;;;;;;;;;;;;;5437:10;989:5618;;;;;;;;5437:10;5463:55;;;;3518:590;989:5618;1899:1:8;;989:5618:17;;;;;;;;5304:99;989:5618;5304:99;;;;;;;;;;;;;;;:::i;:::-;;;;;989:5618;;;;;;;;;;3518:590;989:5618;;;;3783:31;989:5618;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4031:9;989:5618;;;;;6345:105;;;;;989:5618;6345:105;;989:5618;;6345:105;;989:5618;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;-1:-1:-1;;989:5618:17;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;6345:105;:22;989:5618;;6345:22;989:5618;6345:105;;;;;;989:5618;6345:105;989:5618;6345:105;;;3779:329;989:5618;;;;;;;;;;;;;6484:10;989:5618;;;;;;;;6484:10;6510:58;989:5618;6510:58;;3518:590;;6345:105;;;;;;;;;;;;;;:::i;:::-;;;;3779:329;989:5618;;;4079:18;;;;2698:86:8;989:5618:17;;;2743:30:8;;;;989:5618:17;;;;;-1:-1:-1;;989:5618:17;;;;;;1211:34;989:5618;1211:34;989:5618;;;;;;;;;;;;;;;:::o;:::-;;;;;;;;;;;;;;;;;;;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;-1:-1:-1;989:5618:17;;;;;;;;;;;;;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;:::i;:::-;;;;:::o;:::-;;;;;;;;;;;;;;;;;;:::o;:::-;;;;;;;;;-1:-1:-1;989:5618:17;;;;;;;;;;;-1:-1:-1;989:5618:17;;;;;;;;;;;;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;:::i;:::-;;:::o;:::-;;;;;;;;;:::o;:::-;;-1:-1:-1;989:5618:17;;;;;-1:-1:-1;989:5618:17;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::o;:::-;;;;;;;;;;;;;;;-1:-1:-1;989:5618:17;;;;;;;;;;;:::o;:::-;;;;;;;;;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;-1:-1:-1;;989:5618:17;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;:::i;:::-;;;;;;;;:::i;:::-;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;:::i;:::-;;;;;;;;;;:::i;:::-;;;;;;;:::i;:::-;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;-1:-1:-1;;989:5618:17;;;;;;;;;;;;;;;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;1796:162:6;989:5618:17;1710:6:6;989:5618:17;;735:10:7;1855:23:6;1851:101;;1796:162::o;1851:101::-;989:5618:17;;;1901:40:6;;;735:10:7;1901:40:6;;;989:5618:17;1901:40:6",
            linkReferences: {},
            immutableReferences: {
                "5207": [{ start: 3175, length: 32 }],
                "5210": [
                    { start: 580, length: 32 },
                    { start: 1164, length: 32 },
                    { start: 2093, length: 32 },
                ],
                "5213": [
                    { start: 847, length: 32 },
                    { start: 1031, length: 32 },
                    { start: 2846, length: 32 },
                ],
            },
        },
        methodIdentifiers: {
            "ADVANCED_ORDER_FACTORY()": "aa638107",
            "BASIC_ORDER_FACTORY()": "72bdda54",
            "REGISTRY()": "06433b1b",
            "computeOrderAddress(address,bytes32,uint8)": "f04e5bed",
            "createOrder(bytes,((uint256,uint256,address,bytes),(uint64,bytes[],bytes,uint64,uint64,string,string)),(string,uint256)[],uint8,bytes32)":
                "15a96ae9",
            "orders(address)": "f40e8471",
            "owner()": "8da5cb5b",
            "renounceOwnership()": "715018a6",
            "scheduler()": "d1ad17bf",
            "setScheduler(address)": "3f6746ce",
            "transferOwnership(address)": "f2fde38b",
        },
        rawMetadata:
            '{"compiler":{"version":"0.8.25+commit.b61c2a91"},"language":"Solidity","output":{"abi":[{"inputs":[{"internalType":"address","name":"registry","type":"address"},{"internalType":"address","name":"_scheduler","type":"address"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"basicOrderFactory","type":"address"},{"internalType":"address","name":"advancedOrderFactory","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"InvalidRegistryAddress","type":"error"},{"inputs":[],"name":"InvalidSchedulerAddress","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"inputs":[],"name":"UnsupportedOrder","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"orderCreator","type":"address"},{"indexed":true,"internalType":"enum OrderType","name":"orderType","type":"uint8"},{"indexed":true,"internalType":"address","name":"orderContract","type":"address"}],"name":"OrderCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"oldScheduler","type":"address"},{"indexed":true,"internalType":"address","name":"newScheduler","type":"address"}],"name":"SchedulerChanged","type":"event"},{"inputs":[],"name":"ADVANCED_ORDER_FACTORY","outputs":[{"internalType":"contract AdvancedOrderFactory","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"BASIC_ORDER_FACTORY","outputs":[{"internalType":"contract BasicOrderFactory","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REGISTRY","outputs":[{"internalType":"contract Registry","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"origin","type":"address"},{"internalType":"bytes32","name":"salt","type":"bytes32"},{"internalType":"enum OrderType","name":"orderType","type":"uint8"}],"name":"computeOrderAddress","outputs":[{"internalType":"address","name":"order","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"_orderData","type":"bytes"},{"components":[{"components":[{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"chainId","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"internalType":"struct Types.CreatorDefinedTxFields","name":"creatorDefinedTxFields","type":"tuple"},{"components":[{"internalType":"uint64","name":"keyId","type":"uint64"},{"internalType":"bytes[]","name":"analyzers","type":"bytes[]"},{"internalType":"bytes","name":"encryptionKey","type":"bytes"},{"internalType":"uint64","name":"spaceNonce","type":"uint64"},{"internalType":"uint64","name":"actionTimeoutHeight","type":"uint64"},{"internalType":"string","name":"expectedApproveExpression","type":"string"},{"internalType":"string","name":"expectedRejectExpression","type":"string"}],"internalType":"struct Types.SignRequestData","name":"signRequestData","type":"tuple"}],"internalType":"struct Types.CommonExecutionData","name":"_executionData","type":"tuple"},{"components":[{"internalType":"string","name":"denom","type":"string"},{"internalType":"uint256","name":"amount","type":"uint256"}],"internalType":"struct Types.Coin[]","name":"maxKeychainFees","type":"tuple[]"},{"internalType":"enum OrderType","name":"orderType","type":"uint8"},{"internalType":"bytes32","name":"salt","type":"bytes32"}],"name":"createOrder","outputs":[{"internalType":"address","name":"order","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"orderAddress","type":"address"}],"name":"orders","outputs":[{"internalType":"address","name":"orderCreator","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"scheduler","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_scheduler","type":"address"}],"name":"setScheduler","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}],"devdoc":{"errors":{"OwnableInvalidOwner(address)":[{"details":"The owner is not a valid owner account. (eg. `address(0)`)"}],"OwnableUnauthorizedAccount(address)":[{"details":"The caller account is not authorized to perform an operation."}],"ReentrancyGuardReentrantCall()":[{"details":"Unauthorized reentrant call."}]},"kind":"dev","methods":{"computeOrderAddress(address,bytes32,uint8)":{"params":{"origin":"The potential order creator","salt":"The unique salt provided by the frontend"},"returns":{"order":"The computed address of the order"}},"createOrder(bytes,((uint256,uint256,address,bytes),(uint64,bytes[],bytes,uint64,uint64,string,string)),(string,uint256)[],uint8,bytes32)":{"params":{"_orderData":"The data required to create the order","maxKeychainFees":"The maximum fees allowed","orderType":"The type of order to create","salt":"The unique salt provided by the frontend"},"returns":{"order":"The address of the newly created order"}},"owner()":{"details":"Returns the address of the current owner."},"renounceOwnership()":{"details":"Leaves the contract without owner. It will not be possible to call `onlyOwner` functions. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby disabling any functionality that is only available to the owner."},"setScheduler(address)":{"params":{"_scheduler":"The new scheduler address"}},"transferOwnership(address)":{"details":"Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner."}},"version":1},"userdoc":{"kind":"user","methods":{"computeOrderAddress(address,bytes32,uint8)":{"notice":"Computes the deterministic address of a order without deploying it"},"createOrder(bytes,((uint256,uint256,address,bytes),(uint64,bytes[],bytes,uint64,uint64,string,string)),(string,uint256)[],uint8,bytes32)":{"notice":"Creates a new order (Basic or Advanced) using CREATE3"},"setScheduler(address)":{"notice":"Updates the scheduler address"}},"version":1}},"settings":{"compilationTarget":{"src/OrderFactory.sol":"OrderFactory"},"evmVersion":"paris","libraries":{},"metadata":{"bytecodeHash":"none"},"optimizer":{"enabled":true,"runs":10000},"remappings":[":@0xsequence/=node_modules/@0xsequence/",":@openzeppelin/contracts/=node_modules/@openzeppelin/contracts/",":forge-std/=node_modules/forge-std/",":precompile-async/=../../precompiles/async/",":precompile-common/=../../precompiles/common/",":precompile-slinky/=../../precompiles/slinky/",":precompile-warden/=../../precompiles/warden/"],"viaIR":true},"sources":{"../../precompiles/async/IAsync.sol":{"keccak256":"0x05ced5e779e2319419f84fc84330ff43904f567e55e04aa24f2a932833966bf3","license":"LGPL-3.0-only","urls":["bzz-raw://47173b5b0671e73a061aeaf1d6ddf8f0425d7db763996058edf1cecef537ed97","dweb:/ipfs/QmZPX41CYdsCKm6em7XV6Y38KiAsVwMf8wcfkCr465S7GZ"]},"../../precompiles/common/Types.sol":{"keccak256":"0x26a0fc1a82de5f27cb3b5f6794733e2f74185f4953de42ec16e9c2e8dd506e13","license":"LGPL-3.0-only","urls":["bzz-raw://c9e6ec46aa600d6ea18fe633e8eab20eed954c74a30107e205b696023058d52f","dweb:/ipfs/QmQoiFREF8X4bFCqYFeGffWEejUPqFbwhdRmHGfcCsgafB"]},"../../precompiles/slinky/ISlinky.sol":{"keccak256":"0x0a536385d10917240f5052dffb6dabdb91eaed4af0ed3db8fc88da4b8ed10f4c","license":"LGPL-3.0-only","urls":["bzz-raw://c69bcec83a2d1d2308e1c6ba4a8cd2bacca5040eddf0deaf6bcebb99c855f4b7","dweb:/ipfs/QmcrzLv1XoBEJhKDNkD3pKm5RyQoo7xQt3Ntwq1xeDkNXP"]},"../../precompiles/warden/IWarden.sol":{"keccak256":"0xb468c3c8e0ccf7ab67a5ced7ebdad43dae41886e5271060602525cdf91ff0b12","license":"LGPL-3.0-only","urls":["bzz-raw://aa591f70825a9f2507469ad21241ede8dd38fa2720337a3b37074524689dbf72","dweb:/ipfs/QmRXUjP5Snf9BZjgjMqAtJfVEjxRrPEeftTGxPtPtc7x93"]},"node_modules/@0xsequence/create3/contracts/Create3.sol":{"keccak256":"0xf81ebf689cee91714da6194b018ff8ac481a6d99113e5ee5fa416df7e40927f9","license":"Unlicense","urls":["bzz-raw://325c5a0d48001c8ccb425b5f639135015ff898ace956c4337deb74eee06e3bce","dweb:/ipfs/QmUXdBHnUA2KA2rStwxQKwFNZdE3bpSMNWBVFj3X8nHCrP"]},"node_modules/@openzeppelin/contracts/access/Ownable.sol":{"keccak256":"0xff6d0bb2e285473e5311d9d3caacb525ae3538a80758c10649a4d61029b017bb","license":"MIT","urls":["bzz-raw://8ed324d3920bb545059d66ab97d43e43ee85fd3bd52e03e401f020afb0b120f6","dweb:/ipfs/QmfEckWLmZkDDcoWrkEvMWhms66xwTLff9DDhegYpvHo1a"]},"node_modules/@openzeppelin/contracts/utils/Context.sol":{"keccak256":"0x493033a8d1b176a037b2cc6a04dad01a5c157722049bbecf632ca876224dd4b2","license":"MIT","urls":["bzz-raw://6a708e8a5bdb1011c2c381c9a5cfd8a9a956d7d0a9dc1bd8bcdaf52f76ef2f12","dweb:/ipfs/Qmax9WHBnVsZP46ZxEMNRQpLQnrdE4dK8LehML1Py8FowF"]},"node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol":{"keccak256":"0x11a5a79827df29e915a12740caf62fe21ebe27c08c9ae3e09abe9ee3ba3866d3","license":"MIT","urls":["bzz-raw://3cf0c69ab827e3251db9ee6a50647d62c90ba580a4d7bbff21f2bea39e7b2f4a","dweb:/ipfs/QmZiKwtKU1SBX4RGfQtY7PZfiapbbu6SZ9vizGQD9UHjRA"]},"node_modules/@openzeppelin/contracts/utils/math/SafeCast.sol":{"keccak256":"0x195533c86d0ef72bcc06456a4f66a9b941f38eb403739b00f21fd7c1abd1ae54","license":"MIT","urls":["bzz-raw://b1d578337048cad08c1c03041cca5978eff5428aa130c781b271ad9e5566e1f8","dweb:/ipfs/QmPFKL2r9CBsMwmUqqdcFPfHZB2qcs9g1HDrPxzWSxomvy"]},"src/AbstractOrder.sol":{"keccak256":"0x23324d202ecd0b0e8df514c847c5ffb7c980dda6356e52369b59c92d0122bcb2","license":"GPL-3.0","urls":["bzz-raw://11d7cb0dcf8f82e82bdcee2d5c94cec43549cd538d8a0a15dd01735918ddb687","dweb:/ipfs/QmPZtvWpTeKFGaLneDsbdJhsMdSscHCPSpkK1wUo1Dw79m"]},"src/AdvancedOrder.sol":{"keccak256":"0x35a4e711ec977be2b3585b5487e834a88d6d7d22d10115409f183b38a08dd0b0","license":"MIT","urls":["bzz-raw://314591bf632527a86e88c1918723e332203d3f1e6f79d8d82899845a2e388748","dweb:/ipfs/QmYUWX65GmiqFDKbgExzgXZ5pVumLUsCxELa7n81ZXdEYm"]},"src/AdvancedOrderFactory.sol":{"keccak256":"0xb4f0633f80fbc7f460687fb984529036f32b5b2a8c12cf3ef6024a8ec93f96dd","license":"GPL-3.0","urls":["bzz-raw://108f1d7255bac9b8dff792a75b0e00a6145ad2248c78c7d5c819f5d8712a96d4","dweb:/ipfs/QmUw46geSxhD4N4J1NHJJmW5DcapKKRSU4JRLbzfqt2JGf"]},"src/BasicOrder.sol":{"keccak256":"0x10d77a9bf04954a2c0bce3da5f394f889c10c2abb24594f2f855d271736dbd89","license":"GPL-3.0","urls":["bzz-raw://26200aa9dc8c63257ce548e413a9d8ca660bbbe6cf198d717ba7d0f9110f36b0","dweb:/ipfs/QmWMxfHKG4MnE1ZFJPcw8oLCQ3pNfnahng7UaFV3ShFD5m"]},"src/BasicOrderFactory.sol":{"keccak256":"0x7a7db4356f97f99a2f79a9ec00ffd700f41004a5fa2eb10a3c8d2c5e18491a8b","license":"GPL-3.0","urls":["bzz-raw://3088a85ba75627fce1963dce3720cd3e1cbb510fa87475249d286cd4996c9c26","dweb:/ipfs/QmTUf5zBt2KHvNfgQBYDhTP83g1yvFWnzD17EbAenJvX4h"]},"src/IExecution.sol":{"keccak256":"0xc67c05e03f0cba2c7362362f8bfde62f8cfce08e453a672c79993c4e13d51216","license":"GPL-3.0","urls":["bzz-raw://1552fb43e22ae58e375e603d91028f84a90c93289d062565c479b6e7f826c505","dweb:/ipfs/QmeDudELtTiWqDdpANiECvgNbhcgbSSaiya93jS2oM5RX6"]},"src/OrderFactory.sol":{"keccak256":"0x70fd06ee1ceabe05f91a6e6ecaa4b043dc2fc5eb5536e0545753607641701d4b","license":"GPL-3.0","urls":["bzz-raw://3fb2f45bc4f1a973188bbcc30f75ef0965f3a1685e0da7b91c40223980d6c5b2","dweb:/ipfs/QmQosLZYKGQcxk5aoSTAm5zu5GxRFmuTZC24hvg7PyQL8j"]},"src/RLPEncode.sol":{"keccak256":"0xcca94159b83605251dc2f009674e48462faee04789cbdf6f6b7e0a56bacabbef","urls":["bzz-raw://70e3045e54353d4ef91752039da7565fa3becadff31da3416073d8bd02e891f0","dweb:/ipfs/QmWsN3tYGMSXfQVqu5oHgDxkVL3MpdRvLAEt6RuZcQs65p"]},"src/Registry.sol":{"keccak256":"0x56f265d3f8cca26af883a5b9ceb45bc5cb1c25a2f7b09f86d69b6e7f658e5278","license":"GPL-3.0","urls":["bzz-raw://746e97f7945c7672205e1ac09fd9442258b94dba5a6ba28d7f08297ed146799e","dweb:/ipfs/QmYvVHrHarkBmEh2B83K6KnBhC1Y16NVy5Fw6GfyYe3cRg"]},"src/Strings.sol":{"keccak256":"0x5d09227e9577c10fa8ee6bdf50db2c75bef152207b2e2cfdd7d74bf86957cfdb","license":"MIT","urls":["bzz-raw://802112494ac853f0e215b6b501d864419c8a0320caeb459930ff2a8b02998859","dweb:/ipfs/QmaCZvPr9hCyTDtoKMgyoyCKoggY8bKqFqfz7ptijn7FSc"]},"src/Types.sol":{"keccak256":"0x20e3c748935c63d89ea3604a608d8ce8c89eeef56e140b5e5d865058af3cd0b1","license":"GPL-3.0","urls":["bzz-raw://5c50868325afbad0a6d2f90c782465a801a39e95ddbe138945466eb3fe027d66","dweb:/ipfs/QmSUFWVmtTKBsPDo3iXD2pRRnYqooc2yDhwZtM8GcKSGYY"]}},"version":1}',
        metadata: {
            compiler: { version: "0.8.25+commit.b61c2a91" },
            language: "Solidity",
            output: {
                abi: [
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "registry",
                                type: "address",
                            },
                            {
                                internalType: "address",
                                name: "_scheduler",
                                type: "address",
                            },
                            {
                                internalType: "address",
                                name: "owner",
                                type: "address",
                            },
                            {
                                internalType: "address",
                                name: "basicOrderFactory",
                                type: "address",
                            },
                            {
                                internalType: "address",
                                name: "advancedOrderFactory",
                                type: "address",
                            },
                        ],
                        stateMutability: "nonpayable",
                        type: "constructor",
                    },
                    {
                        inputs: [],
                        type: "error",
                        name: "InvalidRegistryAddress",
                    },
                    {
                        inputs: [],
                        type: "error",
                        name: "InvalidSchedulerAddress",
                    },
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "owner",
                                type: "address",
                            },
                        ],
                        type: "error",
                        name: "OwnableInvalidOwner",
                    },
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "account",
                                type: "address",
                            },
                        ],
                        type: "error",
                        name: "OwnableUnauthorizedAccount",
                    },
                    {
                        inputs: [],
                        type: "error",
                        name: "ReentrancyGuardReentrantCall",
                    },
                    { inputs: [], type: "error", name: "UnsupportedOrder" },
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "orderCreator",
                                type: "address",
                                indexed: true,
                            },
                            {
                                internalType: "enum OrderType",
                                name: "orderType",
                                type: "uint8",
                                indexed: true,
                            },
                            {
                                internalType: "address",
                                name: "orderContract",
                                type: "address",
                                indexed: true,
                            },
                        ],
                        type: "event",
                        name: "OrderCreated",
                        anonymous: false,
                    },
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "previousOwner",
                                type: "address",
                                indexed: true,
                            },
                            {
                                internalType: "address",
                                name: "newOwner",
                                type: "address",
                                indexed: true,
                            },
                        ],
                        type: "event",
                        name: "OwnershipTransferred",
                        anonymous: false,
                    },
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "oldScheduler",
                                type: "address",
                                indexed: true,
                            },
                            {
                                internalType: "address",
                                name: "newScheduler",
                                type: "address",
                                indexed: true,
                            },
                        ],
                        type: "event",
                        name: "SchedulerChanged",
                        anonymous: false,
                    },
                    {
                        inputs: [],
                        stateMutability: "view",
                        type: "function",
                        name: "ADVANCED_ORDER_FACTORY",
                        outputs: [
                            {
                                internalType: "contract AdvancedOrderFactory",
                                name: "",
                                type: "address",
                            },
                        ],
                    },
                    {
                        inputs: [],
                        stateMutability: "view",
                        type: "function",
                        name: "BASIC_ORDER_FACTORY",
                        outputs: [
                            {
                                internalType: "contract BasicOrderFactory",
                                name: "",
                                type: "address",
                            },
                        ],
                    },
                    {
                        inputs: [],
                        stateMutability: "view",
                        type: "function",
                        name: "REGISTRY",
                        outputs: [
                            {
                                internalType: "contract Registry",
                                name: "",
                                type: "address",
                            },
                        ],
                    },
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "origin",
                                type: "address",
                            },
                            {
                                internalType: "bytes32",
                                name: "salt",
                                type: "bytes32",
                            },
                            {
                                internalType: "enum OrderType",
                                name: "orderType",
                                type: "uint8",
                            },
                        ],
                        stateMutability: "view",
                        type: "function",
                        name: "computeOrderAddress",
                        outputs: [
                            {
                                internalType: "address",
                                name: "order",
                                type: "address",
                            },
                        ],
                    },
                    {
                        inputs: [
                            {
                                internalType: "bytes",
                                name: "_orderData",
                                type: "bytes",
                            },
                            {
                                internalType:
                                    "struct Types.CommonExecutionData",
                                name: "_executionData",
                                type: "tuple",
                                components: [
                                    {
                                        internalType:
                                            "struct Types.CreatorDefinedTxFields",
                                        name: "creatorDefinedTxFields",
                                        type: "tuple",
                                        components: [
                                            {
                                                internalType: "uint256",
                                                name: "value",
                                                type: "uint256",
                                            },
                                            {
                                                internalType: "uint256",
                                                name: "chainId",
                                                type: "uint256",
                                            },
                                            {
                                                internalType: "address",
                                                name: "to",
                                                type: "address",
                                            },
                                            {
                                                internalType: "bytes",
                                                name: "data",
                                                type: "bytes",
                                            },
                                        ],
                                    },
                                    {
                                        internalType:
                                            "struct Types.SignRequestData",
                                        name: "signRequestData",
                                        type: "tuple",
                                        components: [
                                            {
                                                internalType: "uint64",
                                                name: "keyId",
                                                type: "uint64",
                                            },
                                            {
                                                internalType: "bytes[]",
                                                name: "analyzers",
                                                type: "bytes[]",
                                            },
                                            {
                                                internalType: "bytes",
                                                name: "encryptionKey",
                                                type: "bytes",
                                            },
                                            {
                                                internalType: "uint64",
                                                name: "spaceNonce",
                                                type: "uint64",
                                            },
                                            {
                                                internalType: "uint64",
                                                name: "actionTimeoutHeight",
                                                type: "uint64",
                                            },
                                            {
                                                internalType: "string",
                                                name: "expectedApproveExpression",
                                                type: "string",
                                            },
                                            {
                                                internalType: "string",
                                                name: "expectedRejectExpression",
                                                type: "string",
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                internalType: "struct Types.Coin[]",
                                name: "maxKeychainFees",
                                type: "tuple[]",
                                components: [
                                    {
                                        internalType: "string",
                                        name: "denom",
                                        type: "string",
                                    },
                                    {
                                        internalType: "uint256",
                                        name: "amount",
                                        type: "uint256",
                                    },
                                ],
                            },
                            {
                                internalType: "enum OrderType",
                                name: "orderType",
                                type: "uint8",
                            },
                            {
                                internalType: "bytes32",
                                name: "salt",
                                type: "bytes32",
                            },
                        ],
                        stateMutability: "nonpayable",
                        type: "function",
                        name: "createOrder",
                        outputs: [
                            {
                                internalType: "address",
                                name: "order",
                                type: "address",
                            },
                        ],
                    },
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "orderAddress",
                                type: "address",
                            },
                        ],
                        stateMutability: "view",
                        type: "function",
                        name: "orders",
                        outputs: [
                            {
                                internalType: "address",
                                name: "orderCreator",
                                type: "address",
                            },
                        ],
                    },
                    {
                        inputs: [],
                        stateMutability: "view",
                        type: "function",
                        name: "owner",
                        outputs: [
                            {
                                internalType: "address",
                                name: "",
                                type: "address",
                            },
                        ],
                    },
                    {
                        inputs: [],
                        stateMutability: "nonpayable",
                        type: "function",
                        name: "renounceOwnership",
                    },
                    {
                        inputs: [],
                        stateMutability: "view",
                        type: "function",
                        name: "scheduler",
                        outputs: [
                            {
                                internalType: "address",
                                name: "",
                                type: "address",
                            },
                        ],
                    },
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "_scheduler",
                                type: "address",
                            },
                        ],
                        stateMutability: "nonpayable",
                        type: "function",
                        name: "setScheduler",
                    },
                    {
                        inputs: [
                            {
                                internalType: "address",
                                name: "newOwner",
                                type: "address",
                            },
                        ],
                        stateMutability: "nonpayable",
                        type: "function",
                        name: "transferOwnership",
                    },
                ],
                devdoc: {
                    kind: "dev",
                    methods: {
                        "computeOrderAddress(address,bytes32,uint8)": {
                            params: {
                                origin: "The potential order creator",
                                salt: "The unique salt provided by the frontend",
                            },
                            returns: {
                                order: "The computed address of the order",
                            },
                        },
                        "createOrder(bytes,((uint256,uint256,address,bytes),(uint64,bytes[],bytes,uint64,uint64,string,string)),(string,uint256)[],uint8,bytes32)":
                            {
                                params: {
                                    _orderData:
                                        "The data required to create the order",
                                    maxKeychainFees: "The maximum fees allowed",
                                    orderType: "The type of order to create",
                                    salt: "The unique salt provided by the frontend",
                                },
                                returns: {
                                    order: "The address of the newly created order",
                                },
                            },
                        "owner()": {
                            details:
                                "Returns the address of the current owner.",
                        },
                        "renounceOwnership()": {
                            details:
                                "Leaves the contract without owner. It will not be possible to call `onlyOwner` functions. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby disabling any functionality that is only available to the owner.",
                        },
                        "setScheduler(address)": {
                            params: { _scheduler: "The new scheduler address" },
                        },
                        "transferOwnership(address)": {
                            details:
                                "Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.",
                        },
                    },
                    version: 1,
                },
                userdoc: {
                    kind: "user",
                    methods: {
                        "computeOrderAddress(address,bytes32,uint8)": {
                            notice: "Computes the deterministic address of a order without deploying it",
                        },
                        "createOrder(bytes,((uint256,uint256,address,bytes),(uint64,bytes[],bytes,uint64,uint64,string,string)),(string,uint256)[],uint8,bytes32)":
                            {
                                notice: "Creates a new order (Basic or Advanced) using CREATE3",
                            },
                        "setScheduler(address)": {
                            notice: "Updates the scheduler address",
                        },
                    },
                    version: 1,
                },
            },
            settings: {
                remappings: [
                    "@0xsequence/=node_modules/@0xsequence/",
                    "@openzeppelin/contracts/=node_modules/@openzeppelin/contracts/",
                    "forge-std/=node_modules/forge-std/",
                    "precompile-async/=../../precompiles/async/",
                    "precompile-common/=../../precompiles/common/",
                    "precompile-slinky/=../../precompiles/slinky/",
                    "precompile-warden/=../../precompiles/warden/",
                ],
                optimizer: { enabled: true, runs: 10000 },
                metadata: { bytecodeHash: "none" },
                compilationTarget: { "src/OrderFactory.sol": "OrderFactory" },
                evmVersion: "paris",
                libraries: {},
                viaIR: true,
            },
            sources: {
                "../../precompiles/async/IAsync.sol": {
                    keccak256:
                        "0x05ced5e779e2319419f84fc84330ff43904f567e55e04aa24f2a932833966bf3",
                    urls: [
                        "bzz-raw://47173b5b0671e73a061aeaf1d6ddf8f0425d7db763996058edf1cecef537ed97",
                        "dweb:/ipfs/QmZPX41CYdsCKm6em7XV6Y38KiAsVwMf8wcfkCr465S7GZ",
                    ],
                    license: "LGPL-3.0-only",
                },
                "../../precompiles/common/Types.sol": {
                    keccak256:
                        "0x26a0fc1a82de5f27cb3b5f6794733e2f74185f4953de42ec16e9c2e8dd506e13",
                    urls: [
                        "bzz-raw://c9e6ec46aa600d6ea18fe633e8eab20eed954c74a30107e205b696023058d52f",
                        "dweb:/ipfs/QmQoiFREF8X4bFCqYFeGffWEejUPqFbwhdRmHGfcCsgafB",
                    ],
                    license: "LGPL-3.0-only",
                },
                "../../precompiles/slinky/ISlinky.sol": {
                    keccak256:
                        "0x0a536385d10917240f5052dffb6dabdb91eaed4af0ed3db8fc88da4b8ed10f4c",
                    urls: [
                        "bzz-raw://c69bcec83a2d1d2308e1c6ba4a8cd2bacca5040eddf0deaf6bcebb99c855f4b7",
                        "dweb:/ipfs/QmcrzLv1XoBEJhKDNkD3pKm5RyQoo7xQt3Ntwq1xeDkNXP",
                    ],
                    license: "LGPL-3.0-only",
                },
                "../../precompiles/warden/IWarden.sol": {
                    keccak256:
                        "0xb468c3c8e0ccf7ab67a5ced7ebdad43dae41886e5271060602525cdf91ff0b12",
                    urls: [
                        "bzz-raw://aa591f70825a9f2507469ad21241ede8dd38fa2720337a3b37074524689dbf72",
                        "dweb:/ipfs/QmRXUjP5Snf9BZjgjMqAtJfVEjxRrPEeftTGxPtPtc7x93",
                    ],
                    license: "LGPL-3.0-only",
                },
                "node_modules/@0xsequence/create3/contracts/Create3.sol": {
                    keccak256:
                        "0xf81ebf689cee91714da6194b018ff8ac481a6d99113e5ee5fa416df7e40927f9",
                    urls: [
                        "bzz-raw://325c5a0d48001c8ccb425b5f639135015ff898ace956c4337deb74eee06e3bce",
                        "dweb:/ipfs/QmUXdBHnUA2KA2rStwxQKwFNZdE3bpSMNWBVFj3X8nHCrP",
                    ],
                    license: "Unlicense",
                },
                "node_modules/@openzeppelin/contracts/access/Ownable.sol": {
                    keccak256:
                        "0xff6d0bb2e285473e5311d9d3caacb525ae3538a80758c10649a4d61029b017bb",
                    urls: [
                        "bzz-raw://8ed324d3920bb545059d66ab97d43e43ee85fd3bd52e03e401f020afb0b120f6",
                        "dweb:/ipfs/QmfEckWLmZkDDcoWrkEvMWhms66xwTLff9DDhegYpvHo1a",
                    ],
                    license: "MIT",
                },
                "node_modules/@openzeppelin/contracts/utils/Context.sol": {
                    keccak256:
                        "0x493033a8d1b176a037b2cc6a04dad01a5c157722049bbecf632ca876224dd4b2",
                    urls: [
                        "bzz-raw://6a708e8a5bdb1011c2c381c9a5cfd8a9a956d7d0a9dc1bd8bcdaf52f76ef2f12",
                        "dweb:/ipfs/Qmax9WHBnVsZP46ZxEMNRQpLQnrdE4dK8LehML1Py8FowF",
                    ],
                    license: "MIT",
                },
                "node_modules/@openzeppelin/contracts/utils/ReentrancyGuard.sol":
                    {
                        keccak256:
                            "0x11a5a79827df29e915a12740caf62fe21ebe27c08c9ae3e09abe9ee3ba3866d3",
                        urls: [
                            "bzz-raw://3cf0c69ab827e3251db9ee6a50647d62c90ba580a4d7bbff21f2bea39e7b2f4a",
                            "dweb:/ipfs/QmZiKwtKU1SBX4RGfQtY7PZfiapbbu6SZ9vizGQD9UHjRA",
                        ],
                        license: "MIT",
                    },
                "node_modules/@openzeppelin/contracts/utils/math/SafeCast.sol":
                    {
                        keccak256:
                            "0x195533c86d0ef72bcc06456a4f66a9b941f38eb403739b00f21fd7c1abd1ae54",
                        urls: [
                            "bzz-raw://b1d578337048cad08c1c03041cca5978eff5428aa130c781b271ad9e5566e1f8",
                            "dweb:/ipfs/QmPFKL2r9CBsMwmUqqdcFPfHZB2qcs9g1HDrPxzWSxomvy",
                        ],
                        license: "MIT",
                    },
                "src/AbstractOrder.sol": {
                    keccak256:
                        "0x23324d202ecd0b0e8df514c847c5ffb7c980dda6356e52369b59c92d0122bcb2",
                    urls: [
                        "bzz-raw://11d7cb0dcf8f82e82bdcee2d5c94cec43549cd538d8a0a15dd01735918ddb687",
                        "dweb:/ipfs/QmPZtvWpTeKFGaLneDsbdJhsMdSscHCPSpkK1wUo1Dw79m",
                    ],
                    license: "GPL-3.0",
                },
                "src/AdvancedOrder.sol": {
                    keccak256:
                        "0x35a4e711ec977be2b3585b5487e834a88d6d7d22d10115409f183b38a08dd0b0",
                    urls: [
                        "bzz-raw://314591bf632527a86e88c1918723e332203d3f1e6f79d8d82899845a2e388748",
                        "dweb:/ipfs/QmYUWX65GmiqFDKbgExzgXZ5pVumLUsCxELa7n81ZXdEYm",
                    ],
                    license: "MIT",
                },
                "src/AdvancedOrderFactory.sol": {
                    keccak256:
                        "0xb4f0633f80fbc7f460687fb984529036f32b5b2a8c12cf3ef6024a8ec93f96dd",
                    urls: [
                        "bzz-raw://108f1d7255bac9b8dff792a75b0e00a6145ad2248c78c7d5c819f5d8712a96d4",
                        "dweb:/ipfs/QmUw46geSxhD4N4J1NHJJmW5DcapKKRSU4JRLbzfqt2JGf",
                    ],
                    license: "GPL-3.0",
                },
                "src/BasicOrder.sol": {
                    keccak256:
                        "0x10d77a9bf04954a2c0bce3da5f394f889c10c2abb24594f2f855d271736dbd89",
                    urls: [
                        "bzz-raw://26200aa9dc8c63257ce548e413a9d8ca660bbbe6cf198d717ba7d0f9110f36b0",
                        "dweb:/ipfs/QmWMxfHKG4MnE1ZFJPcw8oLCQ3pNfnahng7UaFV3ShFD5m",
                    ],
                    license: "GPL-3.0",
                },
                "src/BasicOrderFactory.sol": {
                    keccak256:
                        "0x7a7db4356f97f99a2f79a9ec00ffd700f41004a5fa2eb10a3c8d2c5e18491a8b",
                    urls: [
                        "bzz-raw://3088a85ba75627fce1963dce3720cd3e1cbb510fa87475249d286cd4996c9c26",
                        "dweb:/ipfs/QmTUf5zBt2KHvNfgQBYDhTP83g1yvFWnzD17EbAenJvX4h",
                    ],
                    license: "GPL-3.0",
                },
                "src/IExecution.sol": {
                    keccak256:
                        "0xc67c05e03f0cba2c7362362f8bfde62f8cfce08e453a672c79993c4e13d51216",
                    urls: [
                        "bzz-raw://1552fb43e22ae58e375e603d91028f84a90c93289d062565c479b6e7f826c505",
                        "dweb:/ipfs/QmeDudELtTiWqDdpANiECvgNbhcgbSSaiya93jS2oM5RX6",
                    ],
                    license: "GPL-3.0",
                },
                "src/OrderFactory.sol": {
                    keccak256:
                        "0x70fd06ee1ceabe05f91a6e6ecaa4b043dc2fc5eb5536e0545753607641701d4b",
                    urls: [
                        "bzz-raw://3fb2f45bc4f1a973188bbcc30f75ef0965f3a1685e0da7b91c40223980d6c5b2",
                        "dweb:/ipfs/QmQosLZYKGQcxk5aoSTAm5zu5GxRFmuTZC24hvg7PyQL8j",
                    ],
                    license: "GPL-3.0",
                },
                "src/RLPEncode.sol": {
                    keccak256:
                        "0xcca94159b83605251dc2f009674e48462faee04789cbdf6f6b7e0a56bacabbef",
                    urls: [
                        "bzz-raw://70e3045e54353d4ef91752039da7565fa3becadff31da3416073d8bd02e891f0",
                        "dweb:/ipfs/QmWsN3tYGMSXfQVqu5oHgDxkVL3MpdRvLAEt6RuZcQs65p",
                    ],
                    license: null,
                },
                "src/Registry.sol": {
                    keccak256:
                        "0x56f265d3f8cca26af883a5b9ceb45bc5cb1c25a2f7b09f86d69b6e7f658e5278",
                    urls: [
                        "bzz-raw://746e97f7945c7672205e1ac09fd9442258b94dba5a6ba28d7f08297ed146799e",
                        "dweb:/ipfs/QmYvVHrHarkBmEh2B83K6KnBhC1Y16NVy5Fw6GfyYe3cRg",
                    ],
                    license: "GPL-3.0",
                },
                "src/Strings.sol": {
                    keccak256:
                        "0x5d09227e9577c10fa8ee6bdf50db2c75bef152207b2e2cfdd7d74bf86957cfdb",
                    urls: [
                        "bzz-raw://802112494ac853f0e215b6b501d864419c8a0320caeb459930ff2a8b02998859",
                        "dweb:/ipfs/QmaCZvPr9hCyTDtoKMgyoyCKoggY8bKqFqfz7ptijn7FSc",
                    ],
                    license: "MIT",
                },
                "src/Types.sol": {
                    keccak256:
                        "0x20e3c748935c63d89ea3604a608d8ce8c89eeef56e140b5e5d865058af3cd0b1",
                    urls: [
                        "bzz-raw://5c50868325afbad0a6d2f90c782465a801a39e95ddbe138945466eb3fe027d66",
                        "dweb:/ipfs/QmSUFWVmtTKBsPDo3iXD2pRRnYqooc2yDhwZtM8GcKSGYY",
                    ],
                    license: "GPL-3.0",
                },
            },
            version: 1,
        },
        id: 17,
    } as const
).abi;
