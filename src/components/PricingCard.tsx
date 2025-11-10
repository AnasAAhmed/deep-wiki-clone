'use client'
import { useRouter } from "next/navigation";
import { BiCheck } from "react-icons/bi";

export const PricingCard = ({ item, i }: { item: PricingCardType, i: number }) => {
    const router = useRouter();
    const isLoggedIn = false;

    return (
        <div
            key={item.id}
            className={`
                relative flex flex-col 
                rounded-[2rem] border border-foreground/30 
                bg-n-8 text-foreground px-6 py-10 
                transition-all duration-300 ease-out 
                min-w-[18rem] max-w-[22rem]
                hover:scale-105 hover:bg-[linear-gradient(145deg,rgba(29,161,242,0.1),rgba(29,161,242,0.05))]
                hover:shadow-lg hover:border-[#1DA1F2]/50
                flex-1
            `}
        >
            {/* top section */}
            <div className="flex flex-col flex-grow">
                <h4
                    className="text-2xl mb-4 font-medium sm:text-4xl"
                    style={{
                        color:
                            i === 0
                                ? '#1DA1F2'
                                : i === 1
                                ? 'rgb(0, 121, 205)'
                                : 'rgb(0, 60, 134)',
                    }}
                >
                    {item.name}
                </h4>

                <p className="body-2 min-h-[4rem] mb-3 text-n-1/50">
                    {item.description}
                </p>

                <div className="flex items-end gap-1 h-[5.5rem] mb-6">
                    <div className="text-3xl leading-none">$</div>
                    <div className="text-[5.5rem] leading-none font-bold">
                        {item.price}
                    </div>
                </div>

                <div className="mt-auto mb-6">
                    {item.slug ? (
                        <button
                            onClick={() =>
                                router.push(isLoggedIn ? item?.slug! : '/pricing')
                            }
                            className="relative w-full cursor-pointer text-background bg-[#1DA1F2] rounded-xl font-medium text-[16px] inline-flex items-center justify-center h-11 transition-colors hover:opacity-90"
                        >
                            <span className="relative z-10">
                                {item.slug ? "Get started" : "Free Consumable"}
                            </span>
                        </button>
                    ) : (
                        <button
                            className="relative w-full text-background bg-[#1DA1F2] rounded-xl font-medium text-[16px] inline-flex items-center justify-center h-11 transition-colors hover:opacity-90"
                        >
                            <span className="relative z-10">
                                {item.slug ? "Get started" : "Free Consumable"}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* bottom section */}
            <ul className="mt-auto">
                {item.inclusions.map((inclusion, index) => (
                    <li
                        key={index}
                        className="flex items-start py-4 border-t border-n-6"
                    >
                        <div className="size-5 flex items-center justify-center rounded-full bg-[#1DA1F2] shrink-0">
                            <BiCheck color="white" size={18} />
                        </div>
                        <p className="body-2 ml-4">{inclusion.label}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};