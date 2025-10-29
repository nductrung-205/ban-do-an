import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { reviewAPI } from "../api";

export default function Review({ productId, user }) {
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    // Lấy danh sách review khi productId thay đổi
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await reviewAPI.getByProduct(productId);
                // Thay đổi từ res.data thành res.data.data
                setReviews(res.data.data || []); // Lấy mảng reviews từ thuộc tính 'data' của response
                console.log("Reviews fetched:", res.data.data); // Log mảng reviews
            } catch (err) {
                console.error("❌ Lỗi tải review:", err);
            }
        };
        if (productId) fetchReviews();
    }, [productId]);

    // Gửi review mới
    const handleSubmitReview = async () => {
        if (!user) {
            Swal.fire("Thông báo", "Vui lòng đăng nhập để đánh giá!", "info");
            return;
        }

        if (!comment.trim()) {
            Swal.fire("Lỗi", "Vui lòng nhập nội dung đánh giá!", "error");
            return;
        }

        try {
            await reviewAPI.create(productId, { rating, comment });
            Swal.fire("Thành công", "Đã gửi đánh giá!", "success");
            setComment("");
            const res = await reviewAPI.getByProduct(productId);
            // Thay đổi từ res.data thành res.data.data
            setReviews(res.data.data || []); // Lấy mảng reviews từ thuộc tính 'data' của response
            console.log("Reviews updated after submission:", res.data.data); // Log mảng reviews
        } catch (err) {
            Swal.fire("Lỗi", "Không thể gửi đánh giá!", "error");
            console.error(err);
        }
    };
    // Xóa review
    const handleDeleteReview = async (reviewId) => {
        const confirm = await Swal.fire({
            title: "Xóa đánh giá?",
            text: "Bạn có chắc muốn xóa đánh giá này?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        });

        if (!confirm.isConfirmed) return;

        try {
            await reviewAPI.delete(reviewId);
            Swal.fire("Đã xóa!", "", "success");
            setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        } catch (err) {
            console.log(err)
            Swal.fire("Lỗi", "Không thể xóa đánh giá!", "error");
        }
    };

    return (
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Đánh giá của khách hàng
            </h2>

            {/* Form đánh giá */}
            <div className="mb-8 border-b pb-6">
                <h3 className="text-lg font-semibold mb-2">Viết đánh giá của bạn</h3>
                <div className="flex items-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            onClick={() => setRating(star)}
                            className={`cursor-pointer text-2xl ${star <= rating ? "text-yellow-400" : "text-gray-300"
                                }`}
                        >
                            ★
                        </span>
                    ))}
                </div>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-orange-400 outline-none"
                    rows="3"
                    placeholder="Nhập cảm nhận của bạn về món ăn..."
                ></textarea>
                <button
                    onClick={handleSubmitReview}
                    className="mt-3 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition"
                >
                    Gửi đánh giá
                </button>
            </div>

            {/* Danh sách review */}
            {reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map((r) => (
                        <div
                            key={r.id}
                            className="border rounded-xl p-4 flex justify-between items-start"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-800">
                                        {r.user?.fullname || "Người dùng"}
                                    </span>
                                    <span className="text-yellow-400">
                                        {"★".repeat(r.rating)}
                                    </span>
                                </div>
                                <p className="text-gray-700">{r.comment}</p>
                                <small className="text-gray-400">
                                    {new Date(r.created_at).toLocaleDateString()}
                                </small>
                            </div>
                            {user?.id === r.user_id && (
                                <button
                                    onClick={() => handleDeleteReview(r.id)}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Xóa
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-center">Chưa có đánh giá nào.</p>
            )}
        </div>
    );
}
