"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-[#f0a030]" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-[#d97708]",
  titleClassName = "text-[#d97708]",
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        "relative isolate flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between overflow-hidden rounded-xl border border-[rgba(232,224,208,0.07)] bg-[#251810]/95 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.55)] transition-all duration-700 after:absolute after:inset-y-0 after:right-0 after:w-28 after:bg-gradient-to-l after:from-[#1a1107]/90 after:to-transparent after:content-[''] hover:border-[rgba(217,119,8,0.22)] hover:bg-[#2e1e0e] [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
    >
      <div>
        <span className={cn("relative inline-flex rounded-full bg-[#512b0f]/90 p-1 shadow-sm", iconClassName)}>
          {icon}
        </span>
        <p className={cn("text-lg font-medium", titleClassName)}>{title}</p>
      </div>
      <p className="text-lg text-[#c4ae8a]">{description}</p>
      <p className="text-[#6a5640]">{date}</p>
    </div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards = [
    {
      className:
        "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:rounded-xl before:h-[100%] before:content-[''] before:bg-[#07090f]/65 before:bg-blend-overlay grayscale hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className:
        "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:rounded-xl before:h-[100%] before:content-[''] before:bg-[#07090f]/65 before:bg-blend-overlay grayscale hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
  ];

  const displayCards = cards || defaultCards;

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center">
      {displayCards.map((cardProps, index) => (
        <DisplayCard key={index} {...cardProps} />
      ))}
    </div>
  );
}
