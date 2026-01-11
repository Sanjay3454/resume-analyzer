import { cn } from "~/lib/utils";
import ScoreBadge from "~/components/ScoreBadge";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
} from "./Accordion";

const CategoryHeader = ({
  title,
  categoryScore,
}: {
  title: string;
  categoryScore: number;
}) => {
  return (
    <div className="flex flex-row gap-4 items-center w-full">
      <span className="text-lg font-semibold text-slate-800">{title}</span>
      <div className="ml-auto">
        <ScoreBadge score={categoryScore} />
      </div>
    </div>
  );
};

const CategoryContent = ({
  tips,
}: {
  tips: { type: "good" | "improve"; tip: string; explanation: string }[];
}) => {
  return (
    <div className="space-y-4 pt-2 pb-4">
      {tips.map((tip, index) => {
        const isGood = tip.type === "good";
        return (
          <div
            key={index + tip.tip}
            className={cn(
              "flex flex-col gap-2 rounded-lg p-4 border",
              isGood
                ? "bg-slate-50 border-emerald-200"
                : "bg-slate-50 border-amber-200"
            )}
          >
            <div className="flex gap-3">
              <div className={cn("mt-1 p-1 rounded-full flex-shrink-0 h-fit", isGood ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>
                {isGood ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              <div>
                <p className={cn("font-medium text-base", isGood ? "text-emerald-900" : "text-amber-900")}>
                  {tip.tip}
                </p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  {tip.explanation}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  );
};

const Details = ({ feedback }: { feedback: Feedback }) => {
  return (
    <div className="card w-full overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-900">Detailed Feedback</h3>
      </div>
      <Accordion className="divide-y divide-slate-100">
        <AccordionItem id="tone-style" className="border-none">
          <AccordionHeader itemId="tone-style" className="hover:bg-slate-50">
            <CategoryHeader
              title="Tone & Style"
              categoryScore={feedback.toneAndStyle.score}
            />
          </AccordionHeader>
          <AccordionContent itemId="tone-style">
            <CategoryContent tips={feedback.toneAndStyle.tips} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="content" className="border-none">
          <AccordionHeader itemId="content" className="hover:bg-slate-50">
            <CategoryHeader
              title="Content"
              categoryScore={feedback.content.score}
            />
          </AccordionHeader>
          <AccordionContent itemId="content">
            <CategoryContent tips={feedback.content.tips} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="structure" className="border-none">
          <AccordionHeader itemId="structure" className="hover:bg-slate-50">
            <CategoryHeader
              title="Structure"
              categoryScore={feedback.structure.score}
            />
          </AccordionHeader>
          <AccordionContent itemId="structure">
            <CategoryContent tips={feedback.structure.tips} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem id="skills" className="border-none">
          <AccordionHeader itemId="skills" className="hover:bg-slate-50">
            <CategoryHeader
              title="Skills"
              categoryScore={feedback.skills.score}
            />
          </AccordionHeader>
          <AccordionContent itemId="skills">
            <CategoryContent tips={feedback.skills.tips} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default Details;
