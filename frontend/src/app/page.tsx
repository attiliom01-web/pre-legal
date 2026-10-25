import { readFile } from "node:fs/promises";
import { join } from "node:path";
import NdaCreator from "@/components/NdaCreator";

async function read(name: string) {
  "use cache";
  return readFile(join(process.cwd(), "src", "templates", name), "utf8");
}

export default async function Home() {
  const [coverTemplate, termsTemplate] = await Promise.all([
    read("Mutual-NDA-coverpage.md"),
    read("Mutual-NDA.md"),
  ]);
  return <NdaCreator coverTemplate={coverTemplate} termsTemplate={termsTemplate} />;
}
