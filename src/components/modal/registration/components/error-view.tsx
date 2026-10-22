import TxStatus from '@/components/ui/modal/txStatus'
import Notice from '@/components/ui/modal/notice'

interface ErrorViewProps {
  errorMessage: string | null
}

const ErrorView: React.FC<ErrorViewProps> = ({ errorMessage }) => {
  return (
    <>
      <TxStatus state='error' title='Registration Failed' message='Review the details below and try again.' />
      {errorMessage && <Notice tone='danger'>{errorMessage}</Notice>}
    </>
  )
}

export default ErrorView
