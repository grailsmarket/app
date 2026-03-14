import Footer from "@/components/footer"
import FREQUENTLY_ASKED_QUESTIONS from "@/constants/frequently-asked-questions"
import { cn } from "@/utils/tailwind"

const FrequentlyAskedQuestions = () => {
  return (
    <>
      <main className='mx-auto flex max-w-4xl flex-col items-start gap-6 pt-8 font-medium'>
        <h1 className='text-4xl mx-auto font-bold pb-4'>Frequently Asked Questions</h1>
        {FREQUENTLY_ASKED_QUESTIONS.map(({ question, answer }, index) => {
          return (
            <div key={question} className={cn("custom-links w-full flex flex-col gap-1.5 pb-6 border-b-2 border-tertiary", index === FREQUENTLY_ASKED_QUESTIONS.length - 1 && "border-b-0")}>
              <h2 className='text-2xl font-bold'>{question}</h2>
              <p dangerouslySetInnerHTML={{ __html: answer.replaceAll('\n', '<div style="margin-top: 0.6rem;" />') }} />
            </div>
          )
        })}
      </main>
      <Footer />
    </>
  )
}

export default FrequentlyAskedQuestions
