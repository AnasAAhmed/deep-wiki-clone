export const pricing = [
  {
    id: "0",
    name: "Free plan",
    slug: null,
    icon: "/free-plan.svg",
    price: 0,
    credits: '13k',
    creditsNo: 13000,
    description: "Trail use or light personal projects",
    inclusions: [
      {
        label: "13k Free Credits",
        isIncluded: true,
      },
      {
        label: "Limited Access to Services",
        isIncluded: true,
      },
      {
        label: "Priority Customer Support",
        isIncluded: false,
      },
    ],
  },
  {
    id: "1",
    name: "Monthly Plan",
    slug: "monthly-plan",
    icon: "/free-plan.svg",
    price: 75,
    monthly:true,
    credits: '50k',
    creditsNo: 50000,
    description: "Professionals or small teams who prefer flexibilty",
    inclusions: [
      {
        label: "50k Credits",
        isIncluded: true,
      },
      {
        label: "Full features and access to Services",
        isIncluded: true,
      },
      {
        label: "Priority Customer Support",
        isIncluded: true,
      },
    ],
  },
  {
    id: "2",
    name: "Yearly plan",
    description: "Long term user who value stability and privacy continuity",
    slug: "yearly-plan",
    icon: "/free-plan.svg",
    price: 810,
    credits: '150k',
    creditsNo: 150000,
    inclusions: [
      {
        label: "150k Credits",
        isIncluded: true,
      },
      {
        label: "Full Access to Services",
        isIncluded: true,
      },
      {
        label: "Priority Updates & Customer Support",
        isIncluded: true,
      },
    ],
  },
];