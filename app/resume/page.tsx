export default function ResumePage() {
  return (
    <main className="h-screen w-full">
      <object
        aria-label="Resume PDF"
        className="h-full w-full"
        data="/resume.pdf"
        type="application/pdf"
      >
        <p className="p-6 text-center">
          Unable to display the PDF inline. Open it directly{" "}
          <a className="underline" href="/resume.pdf">
            here
          </a>
          .
        </p>
      </object>
    </main>
  );
}
