/**
 * Connect this function to your existing database, Google Classroom importer,
 * Schoology importer, or resource-storage system.
 *
 * It runs only on the server.
 *
 * Return this shape:
 * [
 *   {
 *     id: "resource-chunk-id",
 *     name: "Unit 2 Biology Slides",
 *     location: "Slides 19–21",
 *     text: "The exact relevant excerpt...",
 *     url: "/resources/unit-2-slides"
 *   }
 * ]
 *
 * The supplied fallback implementation returns an empty array. The API route
 * will then use source excerpts already attached to the quiz question.
 */
export async function loadProjectSchoolResources({
  questionId,
  classId,
  topic,
  searchText,
}) {
  void questionId;
  void classId;
  void topic;
  void searchText;

  // Example Prisma-style integration:
  //
  // const rows = await prisma.resourceChunk.findMany({
  //   where: { classId },
  //   take: 8,
  //   select: {
  //     id: true,
  //     text: true,
  //     pageStart: true,
  //     pageEnd: true,
  //     resource: { select: { name: true, sourceUrl: true } },
  //   },
  // });
  //
  // return rows.map((row) => ({
  //   id: row.id,
  //   name: row.resource.name,
  //   location:
  //     row.pageStart && row.pageEnd
  //       ? `Pages ${row.pageStart}–${row.pageEnd}`
  //       : "Relevant section",
  //   text: row.text,
  //   url: row.resource.sourceUrl,
  // }));

  return [];
}
