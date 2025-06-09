// 主要布局

// import MobileNav from '@/components/shared/MobileNav';
// import Sidebar from '@/components/shared/Sidebar';
// import { Toaster } from '@/components/ui/toaster';
import React from 'react'

const Layout = ({children}: {children: React.ReactNode}) => {
  return (
    <main className='root'>    {/* 根布局 */}
    

        <div className='root-container'>
            <div className='wrapper'>
              {children}
            </div>
            <div className='root-footer'>
              <p className='mx-auto'>Copyright © 2023 All rights reserved</p>
            </div>
        </div>  

        {/* <Toaster />  通知组件 */}
     </main>
  )
}

export default Layout;
