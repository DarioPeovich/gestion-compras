import { cn } from "@/lib/utils";


export default function SESPage({
    children,
    className,
    fluid = false,
}) {

    return (

        <main
            className={cn(
                "min-h-screen",
                "bg-slate-100",
                "px-4",
                "py-6",
                "sm:px-6",
                "lg:px-8",
                className
            )}
        >

            <div
                className={cn(
                    "mx-auto",
                    fluid ? "w-full" : "max-w-7xl"
                )}
            >

                {children}

            </div>

        </main>

    );

}