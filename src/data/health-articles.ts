export type HealthSection = { id: string; heading: string; paragraphs: string[] };

export type HealthArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  coverImage: string;
  imageAlt: string;
  content: HealthSection[];
  sources: { label: string; url: string }[];
  status: 'PUBLISHED' | 'DRAFT';
  readingMinutes: number;
};

export const healthCategories = [
  'Dinh dưỡng',
  'Sống khỏe',
  'Chăm sóc cá nhân',
  'Mẹ và bé',
  'Sử dụng thuốc an toàn',
] as const;

export const healthArticles: HealthArticle[] = [
  {
    id: 'health-labels', slug: 'doc-nhan-san-pham-suc-khoe', category: 'Dinh dưỡng',
    title: 'Đọc nhãn sản phẩm sức khỏe: bắt đầu từ thông tin nào?',
    excerpt: 'Một cách đọc nhãn ngắn gọn để so sánh sản phẩm và nhận ra phần thông tin bạn cần kiểm tra thêm.',
    coverImage: '/images/health/labels.svg', imageAlt: 'Minh họa nhãn sản phẩm và kính lúp', readingMinutes: 3, status: 'PUBLISHED',
    content: [
      { id: 'bat-dau', heading: 'Bắt đầu từ phần thông tin rõ ràng nhất', paragraphs: ['Khi chọn một sản phẩm đóng gói, hãy đọc tên sản phẩm, quy cách, thành phần được công bố và hướng dẫn của nhà sản xuất. Những phần này giúp bạn đối chiếu các lựa chọn trên cùng một đơn vị bán.', 'Đừng xem mô tả ngắn trên trang bán hàng là kết luận chuyên môn. Nếu nhãn, cảnh báo hoặc tình trạng sản phẩm chưa rõ, hãy dừng lại để hỏi dược sĩ hoặc cơ sở y tế phù hợp.'] },
      { id: 'so-sanh', heading: 'So sánh trong cùng bối cảnh', paragraphs: ['Một nhãn có thể dùng đơn vị, khẩu phần hoặc quy cách khác nhau. Hãy đặt các sản phẩm cạnh nhau theo cùng quy cách trước khi so sánh giá và thông tin thành phần.', 'Thông tin này chỉ nhằm hỗ trợ đọc nhãn. Nó không thay thế tư vấn dinh dưỡng hay chỉ định điều trị cá nhân.'] },
    ],
    sources: [{ label: 'WHO — Healthy diet', url: 'https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet' }],
  },
  {
    id: 'health-storage', slug: 'bao-quan-thuoc-tai-nha-an-toan', category: 'Sử dụng thuốc an toàn',
    title: 'Bảo quản thuốc tại nhà: những nguyên tắc an toàn cơ bản',
    excerpt: 'Giữ thuốc đúng bao bì, xem hướng dẫn riêng của từng sản phẩm và biết lúc nào nên hỏi dược sĩ.',
    coverImage: '/images/health/storage.svg', imageAlt: 'Minh họa hộp thuốc được đặt trong tủ an toàn', readingMinutes: 3, status: 'PUBLISHED',
    content: [
      { id: 'giu-bao-bi', heading: 'Giữ bao bì và hướng dẫn đi kèm', paragraphs: ['Bao bì gốc và hướng dẫn sử dụng là nơi chứa thông tin bảo quản, hạn dùng và cảnh báo của từng sản phẩm. Việc giữ chúng cùng sản phẩm giúp hạn chế nhầm lẫn trong gia đình.', 'Không chia sẻ thuốc kê đơn hay dùng lại thuốc cũ cho một người khác. Khi không chắc sản phẩm còn phù hợp để dùng, hãy hỏi dược sĩ thay vì tự suy đoán.'] },
      { id: 'an-toan', heading: 'Ưu tiên an toàn trong không gian sống', paragraphs: ['Đặt thuốc ngoài tầm với của trẻ em và thú nuôi, tránh nơi có điều kiện không phù hợp với hướng dẫn trên nhãn. Kiểm tra định kỳ để tách các sản phẩm đã hết hạn hoặc không còn cần dùng.', 'Việc tiêu hủy thuốc cần theo hướng dẫn của địa phương, nhà sản xuất hoặc dược sĩ. Bài viết không thay thế hướng dẫn xử lý cho từng loại thuốc.'] },
    ],
    sources: [{ label: 'FDA — Where and how to dispose of unused medicines', url: 'https://www.fda.gov/consumers/consumer-updates/where-and-how-dispose-unused-medicines' }],
  },
  {
    id: 'health-oral', slug: 've-sinh-rang-mieng-hang-ngay', category: 'Chăm sóc cá nhân',
    title: 'Vệ sinh răng miệng hằng ngày: xây dựng thói quen bền vững',
    excerpt: 'Một vài điểm cần lưu ý để biến việc chăm sóc răng miệng thành thói quen đều đặn và dễ theo dõi.',
    coverImage: '/images/health/oral.svg', imageAlt: 'Minh họa bàn chải, răng và lá cây', readingMinutes: 3, status: 'PUBLISHED',
    content: [
      { id: 'thoi-quen', heading: 'Duy trì thói quen hằng ngày', paragraphs: ['Chăm sóc răng miệng hiệu quả thường bắt đầu từ thói quen đều đặn và cách dùng sản phẩm theo đúng nhãn. Hãy chọn thời điểm phù hợp để cả gia đình có thể duy trì lâu dài.', 'Các vấn đề răng miệng có thể có nhiều nguyên nhân. Đau, sưng, chảy máu kéo dài hoặc thay đổi bất thường cần được đánh giá bởi chuyên môn thay vì tự xử lý tại nhà.'] },
      { id: 'san-pham', heading: 'Chọn sản phẩm theo thông tin công bố', paragraphs: ['Đọc quy cách, đối tượng dùng và hướng dẫn của sản phẩm trước khi mua. Nếu lựa chọn cho trẻ nhỏ hoặc người có tình trạng sức khỏe đặc biệt, nên trao đổi với nha sĩ hoặc nhân viên y tế.', 'Nội dung trên là thông tin chung, không phải chẩn đoán hay phác đồ chăm sóc cá nhân.'] },
    ],
    sources: [{ label: 'WHO — Oral health', url: 'https://www.who.int/en/news-room/fact-sheets/detail/oral-health' }],
  },
  {
    id: 'health-sleep', slug: 'thoi-quen-giup-giac-ngu-deu-dan', category: 'Sống khỏe',
    title: 'Giấc ngủ: sắp xếp thói quen tối để cơ thể được nghỉ ngơi',
    excerpt: 'Một lịch sinh hoạt ổn định và không gian phù hợp có thể giúp bạn quan sát chất lượng giấc ngủ tốt hơn.',
    coverImage: '/images/health/sleep.svg', imageAlt: 'Minh họa mặt trăng, giường ngủ và các vì sao', readingMinutes: 3, status: 'PUBLISHED',
    content: [
      { id: 'lich', heading: 'Nhìn lại nhịp sinh hoạt', paragraphs: ['Một giờ đi ngủ và thức dậy tương đối đều có thể giúp bạn chủ động quan sát nếp sinh hoạt của mình. Bạn có thể ghi lại thời điểm ngủ, thức và cảm nhận vào hôm sau để nhận ra thay đổi.', 'Nhu cầu ngủ khác nhau theo độ tuổi và hoàn cảnh. Vì vậy, đừng dùng một con số chung để tự đánh giá hoặc điều trị cho bản thân.'] },
      { id: 'khi-can-ho-tro', heading: 'Khi nào nên tìm hỗ trợ chuyên môn?', paragraphs: ['Nếu vấn đề giấc ngủ diễn ra thường xuyên hoặc đi kèm dấu hiệu đáng lo, hãy trao đổi với nhân viên y tế. Một cuộc trao đổi có bối cảnh sức khỏe đầy đủ sẽ an toàn hơn việc tự chọn sản phẩm hay biện pháp điều trị.', 'Bài viết chỉ cung cấp kiến thức tham khảo, không thay thế khám và tư vấn y tế.'] },
    ],
    sources: [{ label: 'CDC — About Sleep', url: 'https://www.cdc.gov/sleep/about/' }],
  },
  {
    id: 'health-nutrition', slug: 'dinh-duong-can-bang-theo-nhom-thuc-pham', category: 'Dinh dưỡng',
    title: 'Dinh dưỡng cân bằng: nhìn bữa ăn theo nhóm thực phẩm',
    excerpt: 'Gợi ý một cách quan sát bữa ăn đa dạng, cân bằng và phù hợp với hoàn cảnh của mỗi người.',
    coverImage: '/images/health/nutrition.svg', imageAlt: 'Minh họa đĩa thức ăn nhiều màu và rau quả', readingMinutes: 4, status: 'PUBLISHED',
    content: [
      { id: 'da-dang', heading: 'Đa dạng và cân bằng thay vì một công thức cố định', paragraphs: ['WHO nêu các nguyên tắc chung gồm đủ, cân bằng, điều độ và đa dạng. Cách áp dụng thực tế thay đổi theo tuổi, lối sống, văn hóa, thực phẩm sẵn có và nhu cầu riêng của từng người.', 'Bạn có thể bắt đầu bằng việc quan sát sự đa dạng của nhóm thực phẩm trong các bữa ăn, thay vì tìm một thực đơn giống nhau cho tất cả mọi người.'] },
      { id: 'tu-van', heading: 'Dùng thông tin chung một cách thận trọng', paragraphs: ['Nhãn sản phẩm và nội dung dinh dưỡng tổng quát giúp bạn đặt câu hỏi tốt hơn khi mua sắm. Chúng không thay thế kế hoạch ăn uống cá nhân, đặc biệt khi bạn có bệnh lý hoặc nhu cầu dinh dưỡng riêng.', 'Hãy trao đổi với chuyên gia dinh dưỡng hoặc nhân viên y tế nếu cần một khuyến nghị phù hợp với tình trạng của bạn.'] },
    ],
    sources: [{ label: 'WHO — Healthy diet', url: 'https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet' }],
  },
  {
    id: 'health-device', slug: 'su-dung-thiet-bi-theo-doi-suc-khoe-tai-nha', category: 'Sống khỏe',
    title: 'Dùng thiết bị theo dõi sức khỏe tại nhà: đọc hướng dẫn trước',
    excerpt: 'Thiết bị tại nhà cần được dùng theo hướng dẫn, trong môi trường phù hợp và không thay thế đánh giá chuyên môn.',
    coverImage: '/images/health/device.svg', imageAlt: 'Minh họa thiết bị theo dõi sức khỏe tại nhà', readingMinutes: 3, status: 'PUBLISHED',
    content: [
      { id: 'huong-dan', heading: 'Đọc hướng dẫn trước khi bắt đầu', paragraphs: ['Trước khi dùng một thiết bị tại nhà, hãy xem hướng dẫn sử dụng, điều kiện vận hành, cảnh báo và cách bảo quản do nhà sản xuất cung cấp. Giữ tài liệu này gần thiết bị để dễ tra lại khi cần.', 'Nếu không hiểu thông báo hoặc cách dùng, hãy liên hệ nhà cung cấp, nhà sản xuất hoặc nhân viên y tế thay vì tự diễn giải kết quả.'] },
      { id: 'ghi-nhan', heading: 'Ghi nhận để trao đổi đúng bối cảnh', paragraphs: ['Kết quả từ thiết bị có thể là thông tin để bạn theo dõi và trao đổi với chuyên môn, không phải kết luận chẩn đoán. Ghi lại thời điểm và điều kiện đo sẽ giúp cuộc trao đổi rõ ràng hơn.', 'Thiết bị có dấu hiệu hỏng hoặc cảnh báo bất thường cần được xử lý theo hướng dẫn của nhà sản xuất.'] },
    ],
    sources: [{ label: 'FDA — Frequently Asked Questions About Home Use Devices', url: 'https://www.fda.gov/medical-devices/home-use-devices/frequently-asked-questions-about-home-use-devices' }],
  },
];
