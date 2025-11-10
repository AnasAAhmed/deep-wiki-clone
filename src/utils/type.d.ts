type PricingCardType = {
    id: string;
    name: string;
    slug?: string;
    icon: string;
    price: number;
    credits: string;
    creditsNo: number;
    description: string;
    inclusions: {
        label: string;
        isIncluded: boolean;
    }[];
    monthly?: undefined;
}