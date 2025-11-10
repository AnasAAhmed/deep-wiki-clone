import GoogleAuthProvider from "@/providers/GoogleAuthProvider";
import StoreProvider from "@/providers/StoreProvider";



export const metadata = {
  title: "Login | rrely.io",
  description: "Login | rrely.io",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <StoreProvider>
        <GoogleAuthProvider>
          <div className="w-full h-full flex items-center justify-center ">
            <div className="w-full bg-background flex overflow-hidden relative flex-col md:flex-row ">
              {/* Welcome Section */}
              <div className="flex-1 lg:flesx-2 bg-[url(/background@4x.webp)] dark:bg-[url(/backgroung@4x-dark.webp)] bg-cover bg-center h-screen max-h-[800px] relative flex flex-col  max-lg:hidden px-4 sm:px-16  text-foreground">
                {/* Geometric Shapes */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-[260px] -left-[200px] w-[500px] md:w-[650px] xl:w-[720px] h-[500px] md:h-[650px] xl:h-[720px] bg-gradient-to-br from-[#042f80] via-[#5792ec] to-[#003ba1] rounded-full rotate-[15deg]"></div>
                  <div className="absolute bottom-24 shadow-md left-[400px] w-[200px] h-[200px] bg-gradient-to-br from-[#5994d8] via-[#5792ec] to-[#02488d] rounded-full"></div>
                  <div className="absolute bottom-0 shadow-md -left-24 w-[300px] h-[300px] bg-gradient-to-br from-[#78a7ff] via-[#5792ec] to-[#00276b] rounded-full"></div>
                </div>

                <div className="relative text-white z-10 mt-24 max-w-sm">

                  <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-wider">WELCOME</h1>
                  <h2 className="text-lg md:text-xl font-medium mb-5 opacity-90">AI-powered documentation for your code repositories</h2>
                  <p className="text-md  font-normal md:text-base opacity-80 leading-relaxed">
                    Generate comprehensive documentation from GitHub, GitLab, or Bitbucket repositories with just a few clicks. </p>
                </div>
              </div>

              {/* Sign In Section */}
              {children}
            </div>
          </div>
        </GoogleAuthProvider>
      </StoreProvider>
    </div>
  );
}