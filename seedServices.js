const mongoose = require("mongoose");
const dotenv = require("dotenv");
const serviceModel = require("./models/service-model");

dotenv.config();

const seedServices = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected to database.");

    // Drop all existing indexes to avoid conflicts with schema changes
    try {
      await serviceModel.collection.dropIndexes();
      console.log("Dropped existing indexes.");
    } catch (err) {
      console.log("No indexes to drop or collection doesn't exist yet.");
    }

    // Clear existing services to ensure we have exactly the specialized list
    await serviceModel.deleteMany({});
    console.log("Cleared existing services.");

    const departments = [
      {
        name: "Cardiology",
        description:
          "Advanced heart care including non-invasive diagnostics, interventional procedures, and cardiac rehabilitation.",
        icon: "FavoriteIcon",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBcFYysDiuw-XHV-8WJ2_bkw7HWlrcroLftbcDJLydcG2WpMBkJek0I8TqQisuG66dvSwctX0IjbhNJ6hdsteiPviJ3GwkiA9Dhwq6yNU6Ghcw3hHZ30HHOoel54U1I1DyxYzvjJo2cWNYuJw-p804KRe_pQkKo4swxDCJ60nHT_Q3gOPVW2iKZfefrfHCYn_En8DJRowpXW3Y60Chblj3sQAb5VrF7tR-K3XajkAuZGfWUXqfP21xLdBjy3TkeinQ7PYAh7hWjgne0",
        category: "General",
      },
      {
        name: "Pediatrics",
        description:
          "Comprehensive medical care for infants, children, and adolescents in a friendly environment.",
        icon: "ChildCareIcon",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC4pLR8uUucJhWNIFUZA0GkhazSNcsBA7gfq691K6P-m_syFZErOZkAbN9QWRSh0tTsNrl3eUOc31OJsZI-V_HOJhZDs-G_eV5VvoneKXy01eJuL1BsmFvvoiFgMt39h4XxB3ZEdo3An2KLsvxomrbPViZjrzsRGM3uDs-6EoxE2kqpgC6YpiqPHiUHRy2k67Xmgatc-eurQw0idTHGXP6zVS0kjYD6orhyIYnCPRdXjRWTDJr2hovKsDShbuAQ2TaFya4fDgNJJlUE",
        category: "General",
      },
      {
        name: "Neurology",
        description:
          "Expert diagnosis and treatment of disorders involving the brain, spinal cord, and peripheral nerves.",
        icon: "PsychologyIcon",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuBEimYYTXEcWk5-wbHdQEKOtib3qX_Z60chg2J_LinApv1m_X1beGq1o4WYdsrGngcIVY99cxokQ3Mmu2Xnatda3CoMonYzmWeSM3R6fSNadyNcp4jqyV2ZWG1jXb6NyZMVrTFMCxvgjhH8op3tp6y985nGjYVw1BTl3luBLj0AWe-PVLdpr3THsPDpMGh8i0gH535R0L1Au2DG4O6N0l88fctJXNbVzvRWCeBOPIWjgTsoaD8OxPnT4S3j2lxF6vgI9I-1ZdAX0oEu",
        category: "General",
      },
      {
        name: "Orthopedics",
        description:
          "Specialized care for bones, joints, ligaments, and tendons, from sports injuries to joint replacement.",
        icon: "ArchitectureIcon",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCXWwHap42TGczbePJQxJuUalFRHxRPj60rO12wi_EvxdZ9yAAXrEojzh4qc57eoZj0XNKVaMbbm94UEiIUTPTB4VjNsJcoecvFd-YC174qVf2cmX57PVF0hMaBk5IBldRb8eLjWWCqhG0ojOpxE6ehuuIWkpbab1FR5teNivrAqFKFRKL1prEdqPVtLB7msJDO99_NdVrl7q2-VTDrHXivGiJcXJj4pZh7e1rj7hGP1cg7dyhNGym5Q88FrLW94jKDEqc3pvAzfHcP",
        category: "General",
      },
      {
        name: "Dermatology",
        description:
          "Treatment for conditions of the skin, hair, and nails, including medical and cosmetic dermatology.",
        icon: "SpaIcon",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCs-cggY85Usw74IhfvO8mv187w28FeSuS88wDMgIE6rax61aj8vWSvpmPrFGsHAWGVdTL0dTgD1aQ54nksd9qvYHrXDqru-HqBHQy8NS0d1_6lYYg0TtOCRwYyWDsaoJoGzxLxoFHz4ehYKbki5FIXoiL13kmOTDXeAzd38laiAn6Dj9ME0WZr2zJXFK6dR0GgLXRRPhn54qTX3KCNgrdlRF_YiQANz1QLRPtM2Ujibby70JWEYcqGxjsJcQyDD8pGr7fsDCNwFLLO",
        category: "General",
      },
      {
        name: "Oncology",
        description:
          "Comprehensive cancer care utilizing the latest treatments, research, and supportive services.",
        icon: "ScienceIcon",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAa2O1Xn0vLBhwA6CrhyQtI80QNGAPKTvC5OtSNH4hIt0alE9_5nNsCIq6_y73hJrNJfIyFF84tEc1VT_Mre6enwi4t8CK1jLbEqAO6Yh8Hbmm8EqsWJ6puM9fUkMY4E38JNEaFFy3wFuZpIqUmqFc9ijufAJ_0NT5s3OMEr2Aatyxom9DuCnOjq2fP0ZdSqT_cJxqqr1GGK7cwVtSRBErZPz5-FSnNUEDtDKwNDpV0mGr8p3-GgDINJ848TS_hfBiw40-r9nD7prld",
        category: "General",
      },
      {
        name: "Gynecology",
        description:
          "Nurturing care for expectant mothers and newborns throughout the pregnancy journey.",
        icon: "PregnantWomanIcon",
        imageUrl: "/services/gynecology.png",
        category: "General",
      },
      {
        name: "Ophthalmology",
        description:
          "Advanced eye care including routine exams, vision correction surgery, and treatment for eye diseases.",
        icon: "VisibilityIcon",
        imageUrl: "/services/ophthalmology.png",
        category: "General",
      },
      {
        name: "Gastroenterology",
        description:
          "Expert treatment for digestive system disorders involving the stomach, liver, and intestines.",
        icon: "MedicalServicesIcon",
        imageUrl: "/services/gastro.png",
        category: "General",
      },
      {
        name: "Psychiatry",
        description:
          "Comprehensive mental wellness including diagnosis and treatment for psychological disorders.",
        icon: "PsychologyAltIcon",
        imageUrl: "/services/psychiatry.png",
        category: "General",
      },
    ];

    await serviceModel.insertMany(departments);
    console.log(`${departments.length} services seeded successfully.`);

    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding services:", error);
    process.exit(1);
  }
};

seedServices();
