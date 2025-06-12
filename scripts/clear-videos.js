const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function clearVideos() {
  try {
    const result = await prisma.video.deleteMany({});
    console.log(`Deleted ${result.count} video records from database`);
  } catch (error) {
    console.error('Error clearing videos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearVideos(); 