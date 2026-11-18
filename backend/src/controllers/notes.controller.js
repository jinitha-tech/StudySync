const prisma = require("../db/prisma");

exports.listNotes = async (req, res, next) => {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json(notes);
  } catch (error) {
    return next(error);
  }
};
