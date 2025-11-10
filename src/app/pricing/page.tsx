import { PricingCard } from "@/components/PricingCard";
import { pricing } from "@/utils/constants";
import { Metadata } from "next";
import Link from "next/link";
import { BiArrowBack } from "react-icons/bi";


// export const dynamic = 'force-static';
export const metadata: Metadata = {
    title: "Pricing | rrely.io",
    description:
        "Pricing page at rrely.io discover our premium packges for the ultimate use of our AI-powered documentation for your code repositories Generate comprehensive documentation from GitHub, GitLab, or Bitbucket repositories with just a few clicks.",
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
        },
    },
    openGraph: {
        title: "Pricing | rrely.io",
        description:
            "Pricing page at rrely.io discover our premium packges for the ultimate use of our AI-powered documentation for your code repositories Generate comprehensive documentation from GitHub, GitLab, or Bitbucket repositories with just a few clicks.",
        url: `${process.env.ECOM_STORE_URL}/pricing`,
        images: [
            {
                url: '/pricing.png',
                width: 711,
                height: 400,
                alt: 'rrely.io pricing',
            },
        ],
        siteName: 'rrely.io',
    },
};
const page = () => {

    return (
        <div className="relative flex flex-col items-center justify-center  overflow-hidden bg-gradient-to-b dark:from-[#009dff49] from-[#009dffa1] via-background to-background">

            <Link
                href="/"
                className="group flex items-center gap-2 mt-4 self-start text-md font-medium px-4 mb-4 text-foreground hover:text-[var(--highlight)] transition-transform"
            >
                <span className="group-hover:-translate-x-2 transition-transform">
                    <BiArrowBack size={20} />
                </span>
                Back
            </Link>
            <div className="container relative z-2 mb-12">

                <div className="absolute top-24 left-1/2 w-[60rem] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <img
                        src={'https://conwrite-ai.vercel.app//pricing/stars.svg'}
                        className="w-full"
                        width={950}
                        height={400}
                        alt="Stars"
                    />
                </div>

                <div
                    className={` max-w-[50rem] mx-auto mb-12 lg:mb-20 md:text-center`}
                >
                    <Link href={'/'}>
                        <h1 className="text-6xl hover:scale-105 duration-300 text-shadow-2xs text-shadow-[#67bbf0] font-bold text-center text-[#1DA1F2] tracking-tight select-none mb-2">
                            rrely.io
                        </h1>
                    </Link>

                    <div className="text-center  flex items-center mb-4 md: justify-center"><svg width="5" height="14" viewBox="0 0 5 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 0.822266H1V12.8223H5" stroke="url(#brackets-left)"></path><defs><linearGradient id="brackets-left" x1="50%" x2="50%" y1="0%" y2="100%"><stop offset="0%" stop-color="#89F9E8"></stop><stop offset="100%" stop-color="#FACB7B"></stop></linearGradient></defs></svg><div className="mx-3 text-n-3">Get started with rrely.io</div><svg width="5" height="14" viewBox="0 0 5 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M-2.98023e-08 0.822266H4V12.8223H-2.98023e-08" stroke="url(#brackets-right)"></path><defs><linearGradient id="brackets-right" x1="14.635%" x2="14.635%" y1="0%" y2="100%"><stop offset="0%" stop-color="#9099FC"></stop><stop offset="100%" stop-color="#D87CEE"></stop></linearGradient></defs></svg></div>
                    <h2 className="text-lg text-center  font-mono font-light text-secondary-foreground md:text-xl lg:text-3xl mb-6">
                        Choose the plan that fits your workflow.
                    </h2>

                </div>
                <div className="relative">
                    <div className="flex justify-center px-5 gap-6 max-lg:flex-wrap">
                        {(pricing as PricingCardType[]).map((item, i) => (
                            <PricingCard key={i} item={item} i={i} />
                        ))}
                    </div>
                </div>

            </div>
        </div>

    );
};



export default page;