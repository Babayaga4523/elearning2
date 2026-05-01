import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testVideoUrl(url: string): Promise<boolean> {
  try {
    console.log(`🔍 Testing URL: ${url}`);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Content-Length: ${response.headers.get('content-length')}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.startsWith('video/')) {
        console.log(`   ✅ Valid video URL`);
        return true;
      } else {
        console.log(`   ❌ Not a video file (Content-Type: ${contentType})`);
        return false;
      }
    } else {
      console.log(`   ❌ HTTP Error: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error}`);
    return false;
  }
}

async function main() {
  console.log("🧪 TESTING VIDEO URLs...\n");

  // Get all video modules
  const videoModules = await prisma.module.findMany({
    where: {
      type: "VIDEO",
      isPublished: true,
    },
    include: {
      course: {
        select: {
          title: true,
        }
      }
    }
  });

  console.log(`Found ${videoModules.length} video modules\n`);

  for (const module of videoModules) {
    console.log(`📹 ${module.title}`);
    console.log(`   Course: ${module.course.title}`);
    
    const videoUrl = module.videoUrl || module.url;
    if (videoUrl) {
      const isValid = await testVideoUrl(videoUrl);
      
      if (!isValid) {
        console.log(`\n🔧 Trying alternative URLs...`);
        
        // Test alternative video URLs
        const alternatives = [
          "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
          "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4",
          "https://file-examples.com/storage/fe68c1f7d4c2d1b8e5c7e5e/2017/10/file_example_MP4_480_1_5MG.mp4"
        ];
        
        for (const altUrl of alternatives) {
          console.log(`\n🔄 Testing alternative: ${altUrl}`);
          const altValid = await testVideoUrl(altUrl);
          
          if (altValid) {
            console.log(`\n✅ Found working alternative! Updating database...`);
            
            await prisma.module.update({
              where: { id: module.id },
              data: {
                videoUrl: altUrl,
                url: altUrl,
              }
            });
            
            console.log(`✅ Updated module ${module.id} with working URL`);
            break;
          }
        }
      }
    } else {
      console.log(`   ❌ No video URL found`);
    }
    
    console.log("\n" + "─".repeat(60) + "\n");
  }

  console.log("✅ Video URL testing complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());