// import Footer from '@/components/footer'
// import FREQUENTLY_ASKED_QUESTIONS from '@/constants/frequently-asked-questions'
// import { cn } from '@/utils/tailwind'

// const FrequentlyAskedQuestions = () => {
//   return (
//     <>
//       <main className='mx-auto flex max-w-4xl flex-col items-start gap-6 pt-8 font-medium'>
//         <h1 className='mx-auto pb-4 text-4xl font-bold'>Frequently Asked Questions</h1>
//         {FREQUENTLY_ASKED_QUESTIONS.map(({ question, answer }, index) => {
//           return (
//             <div
//               key={question}
//               className={cn(
//                 'custom-links border-tertiary flex w-full flex-col gap-1.5 border-b-2 pb-6',
//                 index === FREQUENTLY_ASKED_QUESTIONS.length - 1 && 'border-b-0'
//               )}
//             >
//               <h2 className='text-2xl font-bold'>{question}</h2>
//               <p dangerouslySetInnerHTML={{ __html: answer.replaceAll('\n', '<div style="margin-top: 0.6rem;" />') }} />
//             </div>
//           )
//         })}
//       </main>
//       <Footer />
//     </>
//   )
// }

// export default FrequentlyAskedQuestions
