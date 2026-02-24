'use client'

import React, { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

const Drawn140Logo: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useLayoutEffect(() => {
    if (!svgRef.current) return

    const ctx = gsap.context(() => {
      const paths = svgRef.current!.querySelectorAll<SVGPathElement>('path')

      paths.forEach((path) => {
        const length = path.getTotalLength()

        // force drawing state
        path.style.stroke = '#009ee2'
        path.style.strokeWidth = '2'
        path.style.strokeLinecap = 'square'
        path.style.strokeDasharray = `${length}`
        path.style.strokeDashoffset = `${length}`
        path.style.fillOpacity = '0'
      })

      gsap.to(paths, {
        strokeDashoffset: 0,
        duration: 0.7, // fast & crisp
        stagger: 0.08,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(paths, {
            fillOpacity: 1,
            strokeOpacity: 0,
            duration: 0.35,
            stagger: 0.05,
            ease: 'power1.out',
          })
        },
      })
    }, svgRef)

    return () => ctx.revert()
  }, [])

  return (
    <svg
      ref={svgRef}
      width={278}
      height={105}
      viewBox="0 0 278 105"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        margin: '20px auto',
        background: '#fffff',
      }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M69.5064 42.0456C69.5064 36.0305 67.2648 32.4257 64.5475 29.75L39.1314 4.38394C36.5855 1.82379 32.6338 0 28.0949 0H0V34.7033H34.7596V69.4238H0V104.127H104.249V69.4238H69.5064V42.0456Z"
        fill="url(#paint0_linear_700_311)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M104.267 0H69.5078V28.0418C69.5078 31.8949 71.1408 36.4843 73.991 39.1814L99.3685 64.5303C102.596 67.7541 105.96 69.4238 111.601 69.4238H139.01V104.127H173.752V76.0853C173.752 71.132 171.549 67.2232 168.926 64.6074L138.989 34.7033H104.263V0H104.267Z"
        fill="url(#paint1_linear_700_311)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M273.363 30.0368L248.101 4.83774C244.681 1.38282 240.447 0 236.589 0H208.494V34.7033H243.237V69.4238H208.494V34.7376H173.752V0H139.009L138.992 34.7033L173.735 34.7418L173.718 62.5396C173.735 66.4869 175.068 70.7381 177.914 73.5808L203.728 99.3664C207.354 102.988 211.477 103.977 214.632 104.127H278.001V41.3648C278.001 37.683 276.882 33.5645 273.368 30.0368H273.363Z"
        fill="url(#paint2_linear_700_311)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M34.7582 69.4275V34.707H62.7374C64.8289 34.707 66.5562 35.4648 67.8077 36.8904C68.7378 37.9736 69.4964 39.2793 69.4964 41.6896V69.4317H34.7539L34.7582 69.4275Z"
        fill="url(#paint3_linear_700_311)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M138.992 34.7035V69.4239H111.013C108.921 69.4239 107.194 68.6662 105.943 67.2234C105.013 66.1617 104.254 64.8516 104.254 62.4413V34.6992H138.996L138.992 34.7035Z"
        fill="url(#paint4_linear_700_311)"
        style={{ mixBlendMode: 'multiply' }}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M139.008 104.131H173.75V76.162C173.75 74.0728 173.009 72.3475 171.564 71.0974C170.48 70.1684 169.19 69.4277 166.76 69.4277H139.008V104.131Z"
        fill="url(#paint5_linear_700_311)"
        style={{ mixBlendMode: 'multiply' }}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M243.235 69.4061H277.994V41.4585C277.994 39.3692 277.236 37.6439 275.809 36.3938C274.724 35.4648 273.417 34.707 271.004 34.707H243.23V69.4103L243.235 69.4061Z"
        fill="url(#paint6_linear_700_311)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M208.474 34.7031H173.715V62.6721C173.715 64.7613 174.473 66.4867 175.901 67.7368C176.985 68.6658 178.292 69.4236 180.705 69.4236H208.479V34.7031H208.474Z"
        fill="url(#paint7_linear_700_311)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_700_311"
          x1="51.158"
          y1="19.762"
          x2="52.6932"
          y2="126.471"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#009EE2" />
          <stop offset="0.4" stopColor="#1068AF" />
          <stop offset="0.8" stopColor="#203983" />
          <stop offset="1" stopColor="#262772" />
        </linearGradient>
        <linearGradient
          id="paint1_linear_700_311"
          x1="121.15"
          y1="18.7559"
          x2="122.681"
          y2="125.465"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#009EE2" />
          <stop offset="0.4" stopColor="#1068AF" />
          <stop offset="0.8" stopColor="#203983" />
          <stop offset="1" stopColor="#262772" />
        </linearGradient>
        <linearGradient
          id="paint2_linear_700_311"
          x1="208.199"
          y1="17.5058"
          x2="209.734"
          y2="124.214"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#009EE2" />
          <stop offset="0.4" stopColor="#1068AF" />
          <stop offset="0.8" stopColor="#203983" />
          <stop offset="1" stopColor="#262772" />
        </linearGradient>
        <linearGradient
          id="paint3_linear_700_311"
          x1="52.1294"
          y1="69.4275"
          x2="52.1294"
          y2="34.7028"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#262772" stopOpacity="0" />
          <stop offset="0.26" stopColor="#262772" stopOpacity="0.33" />
          <stop offset="0.59" stopColor="#262772" stopOpacity="0.69" />
          <stop offset="0.84" stopColor="#262772" stopOpacity="0.92" />
          <stop offset="1" stopColor="#262772" />
        </linearGradient>
        <linearGradient
          id="paint4_linear_700_311"
          x1="138.992"
          y1="52.0637"
          x2="104.25"
          y2="52.0637"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#262772" stopOpacity="0" />
          <stop offset="1" stopColor="#262772" />
        </linearGradient>
        <linearGradient
          id="paint5_linear_700_311"
          x1="156.379"
          y1="104.131"
          x2="156.379"
          y2="69.4277"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#262772" stopOpacity="0" />
          <stop offset="0.26" stopColor="#262772" stopOpacity="0.33" />
          <stop offset="0.59" stopColor="#262772" stopOpacity="0.69" />
          <stop offset="0.84" stopColor="#262772" stopOpacity="0.92" />
          <stop offset="1" stopColor="#262772" />
        </linearGradient>
        <linearGradient
          id="paint6_linear_700_311"
          x1="260.615"
          y1="69.4061"
          x2="260.615"
          y2="-0.000566236"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#262772" stopOpacity="0" />
          <stop offset="0.26" stopColor="#262772" stopOpacity="0.33" />
          <stop offset="0.59" stopColor="#262772" stopOpacity="0.69" />
          <stop offset="0.84" stopColor="#262772" stopOpacity="0.92" />
          <stop offset="1" stopColor="#262772" />
        </linearGradient>
        <linearGradient
          id="paint7_linear_700_311"
          x1="191.09"
          y1="34.7031"
          x2="191.09"
          y2="69.4278"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#262772" stopOpacity="0" />
          <stop offset="0.26" stopColor="#262772" stopOpacity="0.33" />
          <stop offset="0.59" stopColor="#262772" stopOpacity="0.69" />
          <stop offset="0.84" stopColor="#262772" stopOpacity="0.92" />
          <stop offset="1" stopColor="#262772" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default Drawn140Logo
