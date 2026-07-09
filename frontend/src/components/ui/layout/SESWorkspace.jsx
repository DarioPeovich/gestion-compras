import { cn } from "@/lib/utils";

export default function SESWorkspace({

    title,

    subtitle,

    children,

    className

}) {

    return (

        <div

            className={cn(

                "mx-auto",

                "max-w-7xl",

                "rounded-3xl",

                "bg-white",

                "border",

                "border-slate-200",

                "shadow-[0_12px_40px_rgba(15,23,42,.08)]",

                "overflow-hidden",

                className

            )}

        >

            {(title || subtitle) && (

                <div

                    className="

                        px-10

                        pt-8

                        pb-7

                        bg-white

                    "

                >

                    <h1

                        className="

                            text-3xl

                            font-semibold

                            tracking-tight

                            text-slate-800

                        "

                    >

                        {title}

                    </h1>

                    {subtitle && (

                        <p

                            className="

                                mt-2

                                text-slate-500

                            "

                        >

                            {subtitle}

                        </p>

                    )}

                </div>

            )}

            <div

                className="

                    px-10

                    pb-10

                    space-y-10

                "

            >

                {children}

            </div>

        </div>

    )

}