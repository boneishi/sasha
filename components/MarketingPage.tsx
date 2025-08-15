
import React from 'react';
import {
    PencilIcon,
    ManufacturingIcon,
    CrmIcon,
    ProductionIcon,
    InstallationIcon,
    CheckmarkIcon
} from './icons';

interface FeatureSectionProps {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    title: string;
    subtitle: string;
    description: string;
    features: string[];
    reverse?: boolean;
}

const FeatureSection: React.FC<FeatureSectionProps> = ({ icon: Icon, title, subtitle, description, features, reverse = false }) => (
    <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
        <div className={`lg:col-start-1 ${reverse ? 'lg:order-last' : ''}`}>
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-lg inline-block text-white">
                    <Icon className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
            </div>
            <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
            {description && <p className="mt-2 text-base text-gray-500">{description}</p>}
        </div>
        <div className="mt-10 lg:mt-0 lg:col-start-2">
            <div className="bg-white p-8 rounded-lg shadow-lg h-full">
                <ul role="list" className="space-y-4">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <div className="flex-shrink-0">
                                <CheckmarkIcon className="h-6 w-6 text-green-500" />
                            </div>
                            <p className="ml-3 text-base text-gray-700">{feature}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
);

const marketingData = [
    {
        icon: PencilIcon,
        title: "Design and Quote",
        subtitle: "Cloud based software that works anywhere you do.",
        description: "",
        features: [
            "Window and door design drawing board",
            "Branded quotes that make a professional impact",
            "Photo upload for easy customer reference",
            "Integrated Google maps for site verification",
        ],
    },
    {
        icon: ManufacturingIcon,
        title: "integrateBUILD",
        subtitle: "Prepare for Manufacturing",
        description: "",
        features: [
            "Integrated manufacture processing links orders to production",
            "Shared-Access System – across both your business or your manufacturing partners",
            "Glass order/cutting list generation",
            "Price file management for accurate costings",
            "Timber cutting lists for timber window companies",
            "Glass cutting sheet/orders with precise measurements",
            "Ironmongery picking lists to streamline component selection",
        ],
        reverse: true,
    },
    {
        icon: CrmIcon,
        title: "integrateCRM",
        subtitle: "Nurture Customers",
        description: "",
        features: [
            "Connect and manage Email. Appointments, Contacts",
            "Team calendars for coordinated customer service",
            "Order & quote reporting for business insights",
            "Installation calendar for simple scheduling",
            "Customer service ticketing for issue resolution",
            "System reporting for performance analysis",
            "Infohub (intranet) for team coordination",
            "Order processing & management to track progress automatically",
        ],
    },
    {
        icon: ProductionIcon,
        title: "integratePRO",
        subtitle: "Manage Production",
        description: "",
        features: [
            "Adjust sales drawing and process to production",
            "Production scheduling for optimal workflow",
            "Paperless job specifications for detailed overviews",
            "Production tracking in real time",
            "Production time tracking for accurate costing",
            "Frame & sash component tracking throughout the process",
            "Production time sheets for labour management",
        ],
        reverse: true,
    },
    {
        icon: InstallationIcon,
        title: "integrateFIT",
        subtitle: "Professional Installation",
        description: "",
        features: [
            "Online job details accessible from any device",
            "On-site time estimator for accurate scheduling",
            "Installation calendar with route planning",
            "Onsite picture upload for instant documentation",
            "Onsite parking information to save time",
            "On-site extras capture",
            "Installation reports for quality assurance",
            "Snagging & warranties management",
        ],
    }
];

export const MarketingPage: React.FC = () => {
    return (
        <div className="bg-stone-50 min-h-full overflow-y-auto">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Cloud-Powered Solutions for Joinery Professionals</h1>
                    <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500">From initial design to final installation, our integrated suite of tools streamlines every step of your workflow.</p>
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="space-y-24">
                   {marketingData.map((data, index) => (
                       <FeatureSection key={index} {...data} />
                   ))}
                </div>
            </main>
        </div>
    );
};