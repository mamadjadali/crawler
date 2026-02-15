import Image from 'next/image'

export const Logos = async () => {
  return (
    <>
      <Image
        src="/dark.svg"
        alt="Logo Dark Mode"
        width={150}
        height={150}
        className={'light-mode-image'}
      />
      <Image
        src="/light.svg"
        alt="Logo Light Mode"
        width={150}
        height={150}
        className={'dark-mode-image'}
      />
    </>
  )
}
