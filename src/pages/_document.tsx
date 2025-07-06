import Document, { Html, Head } from 'next/document';
class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link rel="preload" href="/" as="document" />
          <link rel="preload" href="/friends" as="document" />
          <link rel="preload" href="/shop" as="document" />
          <link rel="preload" href="/reference" as="document" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
