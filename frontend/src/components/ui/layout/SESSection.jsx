import { cn } from "@/lib/utils";

export default function SESSection({
    title,
    subtitle,
    icon: Icon,
    actions,
    children,
    className,
    contentClassName,
    variant = "modern",
}) {

    const variants = {

        executive: {
            section: "rounded-xl border border-slate-200 bg-white shadow-sm",
            header: "px-8 py-6 border-b border-slate-200",
            icon: "bg-slate-100 text-slate-700",
        },

        modern: {
            section: "rounded-2xl bg-white border border-slate-100 shadow-[0_6px_20px_rgba(15,23,42,.06)]",
            header: "px-8 py-7 border-b border-slate-100",
            icon: "bg-blue-50 text-blue-700",
        },

        premium: {
            section: "rounded-2xl bg-white border border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,.08)]",
            header: "px-8 py-7 border-b border-slate-100",
            icon: "bg-gradient-to-br from-blue-600 to-cyan-500 text-white",
        }

    }

    const style = variants[variant]

    return (

        <section
            className={cn(
                style.section,
                "overflow-hidden transition-all duration-300",
                className
            )}
        >

            <header
                className={cn(
                    style.header,
                    "flex items-center justify-between"
                )}
            >

                <div className="flex items-center gap-5">

                    {Icon && (

                        <div
                            className={cn(
                                style.icon,
                                "flex h-12 w-12 items-center justify-center rounded-xl"
                            )}
                        >
                            <Icon size={22} />
                        </div>

                    )}

                    <div>

                        <h2 className="text-xl font-semibold tracking-tight text-slate-800">
                            {title}
                        </h2>

                        {subtitle && (
                            <p className="mt-1 text-sm text-slate-500">
                                {subtitle}
                            </p>
                        )}

                    </div>

                </div>

                {actions}

            </header>

            <div
                className={cn(
                    "p-8",
                    contentClassName
                )}
            >
                {children}
            </div>

        </section>

    )

}