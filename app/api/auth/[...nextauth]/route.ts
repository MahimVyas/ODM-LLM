import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  // Optional: You can customize the styling of the default login page here if you want
  theme: {
    colorScheme: "dark",
    brandColor: "#2563eb", // blue-600
    logo: "https://your-logo-url-here.png", // Optional
  },
});

export { handler as GET, handler as POST };