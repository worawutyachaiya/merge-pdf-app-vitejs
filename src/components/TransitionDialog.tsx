import { Slide, SlideProps } from '@mui/material'
import { forwardRef, ReactElement, Ref } from 'react'

const Transition = forwardRef(function Transition(
  props: SlideProps & { children?: ReactElement<any, any> },
  ref: Ref<unknown>
) {
  return <Slide direction='up' ref={ref} {...props} />
})

export default Transition
