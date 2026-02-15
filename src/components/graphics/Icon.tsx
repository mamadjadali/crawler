import Image from 'next/image'

export const Icons = async () => {
  return (
    <>
      <Image
        src="/dark-ico.svg"
        alt="Icon Light Mode"
        width={150}
        height={150}
        className={'light-mode-image'}
      />
      <Image
        src="/light-ico.svg"
        alt="Icon Dark Mode"
        width={150}
        height={150}
        className={'dark-mode-image'}
      />
    </>
  )
}
