import React, { useState, useEffect } from "react";

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      image: "https://statics.vinwonders.com/com-tam-ngon-o-sai-gon-0_1630562640.jpg",
      title: "Món ăn ngon mỗi ngày",
      subtitle: "Giao hàng nhanh trong 30 phút"
    },
    {
      id: 2,
      image: "https://khaihoanphuquoc.com.vn/wp-content/uploads/2023/11/nu%CC%9Bo%CC%9B%CC%81c-ma%CC%86%CC%81m-cha%CC%82%CC%81m-go%CC%89i-cuo%CC%82%CC%81n.png",
      title: "Hương vị chính gốc",
      subtitle: "Giảm giá 20% cho đơn hàng đầu tiên"
    },
    {
      id: 3,
      image: "https://www.cet.edu.vn/wp-content/uploads/2021/05/che-khoai-deo.jpg",
      title: "Tráng miệng tươi mát",
      subtitle: "Healthy & Delicious"
    },
    {
      id: 4,
      image: "https://cubes-asia.com/storage/blogs/2024-12/5-cach-pha-ca-phe-sua-tuoi-khong-duong-co.jpeg",
      title: "Nước uống đậm vị",
      subtitle: "Combo tiết kiệm chỉ từ 99k"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl group">
     
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          
       
          <div className="absolute bottom-12 left-12 text-white">
            <h2 className="text-4xl font-bold mb-2">{slide.title}</h2>
            <p className="text-xl text-gray-200">{slide.subtitle}</p>
            <button className="mt-4 px-6 py-3 bg-orange-500 rounded-full font-semibold hover:bg-orange-600 transition transform hover:scale-105">
              Đặt ngay
            </button>
          </div>
        </div>
      ))}

     
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100"
      >
        ❮
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100"
      >
        ❯
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? "bg-white w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}