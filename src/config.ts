// TOÀN BỘ số liệu cân bằng và câu chữ tiếng Việt nằm ở file này.
// Sau khi chỉnh số, chạy `npm run simulate` để kiểm tra lại cân bằng.
// Trong câu chữ, {ten_bien} sẽ được thay bằng số liệu thật khi hiển thị.

export type TierId = 'startup' | 'middle' | 'heir'
export type AllocationId = 'all' | 'balanced' | 'high' | 'low'

export const CONFIG = {
  totalTurns: 6,
  consumerNeed: {
    spendForFullSatisfaction: 0.12, // phần chênh giữa mục tiêu và vốn đầu để lấp đầy nhu cầu tiêu dùng
    requiredSatisfaction: 60, // mức thỏa mãn tối thiểu để thắng
  },

  // Thời lượng hoạt ảnh sau khi kéo cần gạt (mili giây)
  animation: { produceMs: 3000, strikeMs: 1800 },

  // Màn 1: quy mô tư bản ứng trước
  tiers: [
    {
      id: 'heir' as TierId,
      name: 'Thừa kế',
      capital: 50000,
      target: 74000,
      difficulty: 'Dễ',
      blurb: 'Mua được ngay cả ba xưởng và máy cấp cao nhất.',
    },
    {
      id: 'middle' as TierId,
      name: 'Trung lưu',
      capital: 5000,
      target: 9800,
      difficulty: 'Vừa',
      blurb: 'Đủ lấp đầy một xưởng và mua máy cấp đầu.',
    },
    {
      id: 'startup' as TierId,
      name: 'Khởi nghiệp',
      capital: 500,
      target: 1700,
      difficulty: 'Khó',
      blurb: 'Chỉ đủ tiền ứng lương và nguyên liệu cho vài công nhân.',
    },
  ],

  // Công nhân (v) và nguyên liệu (một phần của c)
  worker: {
    baseWage: 100, // lương mỗi công nhân mỗi chu kỳ
    outputValue: 300, // giá trị sản phẩm một công nhân làm ra mỗi chu kỳ khi máy cấp 0
    materialRate: 0.4, // phần nguyên liệu trong giá trị sản phẩm
  },

  // Máy móc: năng suất lao động và khấu hao
  machine: {
    maxLevel: 5,
    upgradeCost: [1000, 2000, 3500, 6000, 10000], // giá lên cấp 1..5
    productivityPerLevel: 0.3, // mỗi cấp tăng 30% sản lượng trên mỗi công nhân
    lifeTurns: 10, // giá mua máy được chia đều vào c trong 10 chu kỳ
  },

  // Xưởng: tích tụ tư bản
  factory: {
    capacity: 10, // số công nhân tối đa mỗi xưởng
    max: 3,
    cost: [0, 3000, 6000], // giá xưởng thứ 1, 2, 3
  },

  // Mức hài lòng: trình độ bóc lột sức lao động
  satisfaction: {
    start: 70,
    drift: -3, // thay đổi mỗi chu kỳ sản xuất bình thường
    overtime: -25, // thay đổi mỗi chu kỳ ép tăng ca
    lowThreshold: 30, // dưới mức này thì hiện cảnh báo
    afterStrike: 10, // mức hài lòng khi công nhân quay lại sau đình công
  },
  overtime: {
    outputMult: 1.4, // sản lượng khi ép tăng ca
  },
  teamBuilding: {
    costPerWorker: 100,
    minCost: 300,
    gain: 15,
  },
  raise: {
    pct: 0.1, // tăng 10% lương cố định
    gain: 15,
  },
  strike: {
    wageCostRate: 0.5, // phần lương vẫn phải trả khi xưởng dừng
  },

  // Popup phân bổ m
  allocations: [
    { id: 'all' as AllocationId, reinvest: 1, label: 'Tái đầu tư toàn bộ' },
    { id: 'balanced' as AllocationId, reinvest: 0.5, label: 'Chia đều 50% đầu tư, 50% tiêu dùng' },
    { id: 'high' as AllocationId, reinvest: 0.7, label: 'Tái đầu tư 70%, tiêu dùng 30%' },
    { id: 'low' as AllocationId, reinvest: 0.3, label: 'Tái đầu tư 30%, tiêu dùng 70%' },
  ],

  // Sự kiện đầu chu kỳ
  events: {
    randomChance: 0.5, // xác suất có sự kiện ở chu kỳ không được xếp sẵn
    unemployment: {
      guaranteedTurns: [2, 3], // chắc chắn xuất hiện sớm trong ván 6 chu kỳ
      maxCount: 2,
      weight: 1,
      wageFactor: 0.4, // lương thấp hơn 60%
      groupShare: 0.3, // số người xin việc so với số công nhân hiện có
      groupMin: 2,
      groupMax: 5,
      satisfaction: -10,
    },
    machine: {
      guaranteedTurns: [4, 5],
      maxCount: 1,
      weight: 0,
      cost: 2500,
      productivityBonus: 0.5,
      layoffShare: 0.4, // thay thế khoảng 40% nhân công
      satisfaction: -12,
    },
    welfare: {
      maxCount: 3,
      weight: 3,
      gainTeamBuilding: 15,
      gainLeave: 12,
      leaveOutputFactor: 0.85, // sản lượng chu kỳ này nếu cho nghỉ phép
      refuse: -15,
    },
    rival: {
      maxCount: 2,
      weight: 2,
      priceFactor: 0.5, // mua lại bằng 50% giá mở xưởng mới
    },
  },

  text: {
    title: 'TÍCH LŨY TƯ BẢN',
    question: 'Anh/Chị là một nhà tư bản. Sau khi bóc lột công nhân, giá trị thặng dư sẽ được dùng như thế nào?',
    startHint: 'Quy mô tư bản ứng trước càng lớn, tích lũy càng nhanh.',
    startChoose: 'Chọn vốn ban đầu',
    selectBack: 'Quay lại',
    selectEyebrow: 'CHỌN THỬ THÁCH',
    selectHint: 'Mức vốn nhỏ đòi hỏi tính toán chặt chẽ hơn. Hãy chọn hành trình phù hợp.',
    landingEyebrow: 'MỘT TRÒ CHƠI MÔ PHỎNG KINH TẾ',
    landingPlay: 'CHƠI NGAY',
    landingTagline: 'Chọn quy mô vốn, học cách vận hành và xây dựng đế chế của bạn.',
    help: {
      title: 'CÁCH CHƠI',
      intro: 'Điều hành xưởng qua 6 chu kỳ, đạt mục tiêu tư bản và dành một phần giá trị thặng dư cho nhu cầu tiêu dùng.',
      zoneHelp: {
        machine: 'Mỗi cấp máy tăng năng suất 30%; hình dáng dây chuyền thay đổi theo cấp. Giá máy được khấu hao dần trong 10 chu kỳ.',
        hr: 'Thuê người để sản xuất. Tăng lương hoặc Team Building cải thiện hài lòng; tăng ca tăng sản lượng 40% nhưng giảm hài lòng mạnh.',
        lever: 'Mỗi chu kỳ ứng tiền nguyên liệu (c) và lương (v), rồi nhận doanh thu. m = doanh thu − c − v; dự báo bên phải giúp tránh thiếu vốn và đình công.',
        safe: 'Chia m giữa tái đầu tư và tiêu dùng: 100/0, 70/30, 50/50 hoặc 30/70. Chi tiêu làm đầy thỏa mãn nhu cầu nhưng rút khỏi vốn sản xuất.',
        gate: 'Mỗi xưởng mới thêm chỗ cho 10 công nhân và mở rộng dây chuyền. Sự kiện đối thủ phá sản có thể cho bạn mua xưởng với giá ưu đãi.',
      },
      goalLabel: 'MỤC TIÊU',
      goal: 'Trong tối đa 6 chu kỳ, vừa đạt mục tiêu tổng tư bản, vừa tích lũy ít nhất 60% thỏa mãn nhu cầu tiêu dùng. Tiêu dùng nhiều làm đầy thanh nhu cầu nhưng rút tiền khỏi vốn sản xuất.',
      controlsLabel: 'ĐIỀU KHIỂN',
      controls: 'Nhấp vào sàn để nhân vật tự tìm đường ngắn nhất tới đó; nhấp sát công cụ để tương tác · WASD hoặc phím mũi tên để di chuyển thủ công · E để tương tác · phím 1–5 mở nhanh khu vực · Esc để đóng.',
      steps: [
        {
          title: '1. Chuẩn bị',
          body: 'Ở phòng nhân sự, thuê công nhân. Dùng khu máy móc để tăng năng suất hoặc cổng xưởng để mở rộng. Có thể tăng lương, tổ chức Team Building hoặc bật tăng ca.',
        },
        {
          title: '2. Sản xuất',
          body: 'Đến cần gạt và chọn SẢN XUẤT. Mỗi chu kỳ cần ứng trước tiền nguyên liệu và lương; xem dự báo để tránh phá sản. Tăng ca tạo thêm thặng dư nhưng làm giảm hài lòng, có thể dẫn đến đình công.',
        },
        {
          title: '3. Phân bổ giá trị thặng dư',
          body: 'Sau sản xuất, đến két sắt để chia thặng dư vào tái đầu tư hoặc tiêu dùng (có lựa chọn chia đều 50/50). Tiêu dùng làm tăng thanh thỏa mãn nhu cầu; thắng cần đạt ít nhất 60% thanh này và mục tiêu tư bản trong 6 chu kỳ.',
        },
      ],
      tipLabel: 'GỢI Ý',
      tip: 'c là chi phí máy móc và nguyên liệu, v là tiền lương, m là giá trị thặng dư (doanh thu − c − v). Theo dõi mức hài lòng và dự báo ở bảng bên phải.',
      close: 'Đã hiểu',
      open: 'Cách chơi',
    },
    tutorial: {
      goHr: {
        title: 'Bước 1 · Phòng nhân sự',
        move: 'Dùng WASD/phím mũi tên hoặc nhấp sàn để đi tới phòng nhân sự. Nhấp sát công cụ để mở, hoặc đứng gần rồi nhấn E.',
        near: 'Đã tới nơi. Nhấn E, phím 2 hoặc nhấp trực tiếp phòng nhân sự để mở.',
      },
      hire: {
        title: 'Bước 2 · Thuê công nhân',
        body: 'Thuê người cần ứng trước tiền lương; số tiền sẽ trừ ngay khỏi tiền mặt. Đây là tiền lương chu kỳ này nên không bị trừ lần thứ hai khi sản xuất.',
        menu: 'Chọn +1 công nhân để tiếp tục. Tiền lương hiển thị sẽ được ứng ngay lúc thuê.',
      },
      goLever: {
        title: 'Bước 3 · Cần gạt sản xuất',
        move: 'Nhấp sàn để đi tới cần gạt, hoặc dùng phím di chuyển. Tại công cụ, nhấn E/phím 3 hoặc nhấp sát để mở.',
        near: 'Đã tới cần gạt. Nhấn E, phím 3 hoặc nhấp sát công cụ để mở.',
      },
      produce: {
        title: 'Bước 4 · Sản xuất',
        body: 'Đọc dự báo rồi nhấn SẢN XUẤT. Doanh thu trừ nguyên liệu, khấu hao máy (c) và lương (v) tạo ra giá trị thặng dư m.',
        menu: 'Nhấn SẢN XUẤT để chạy chu kỳ đầu tiên.',
      },
      result: 'Đọc doanh thu và c, v, m. Tăng ca có thể tăng sản lượng nhưng làm giảm hài lòng; nếu hài lòng cạn kiệt, công nhân đình công.',
      goSafe: {
        title: 'Bước 5 · Két sắt',
        move: 'Sau khi đọc kết quả, tới két sắt để chọn tái đầu tư hay tiêu dùng phần thặng dư.',
        near: 'Đã tới két. Nhấn E, phím 4 hoặc nhấp sát công cụ để phân bổ thặng dư.',
      },
      allocate: {
        title: 'Bước 6 · Tái đầu tư hay tiêu dùng',
        body: 'Tái đầu tư biến một phần m thành tư bản cho chu kỳ sau; chi tiêu làm tăng thỏa mãn nhu cầu tiêu dùng. Bạn cần đạt ít nhất 60% thanh này và mục tiêu vốn trong tối đa 6 chu kỳ.',
        menu: 'Chọn một phương án phân bổ để hoàn tất hướng dẫn; chia đều 50/50 là cách cân đối vốn và tiêu dùng.',
      },
      upgradeMachine: {
        title: 'Khu máy · Nâng cấp',
        body: 'Mỗi cấp máy tăng năng suất và thay đổi hình dáng dây chuyền. Giá máy được tính vào tư bản rồi khấu hao qua nhiều chu kỳ; menu đóng để bạn xem hiệu ứng nâng cấp.',
      },
      expandFactory: {
        title: 'Cổng xưởng · Mở rộng',
        body: 'Mở xưởng tăng sức chứa lao động và thêm dây chuyền. Mỗi xưởng có giá riêng; mua xưởng làm thay đổi diện mạo khu đất.',
      },
      mechanics: {
        machine: 'Mỗi cấp máy tăng năng suất 30%; hình dáng dây chuyền thay đổi theo cấp. Giá máy được khấu hao dần trong 10 chu kỳ.',
        hr: 'Tiền lương được ứng ngay khi thuê; tăng lương hay Team Building cải thiện hài lòng. Tăng ca tăng sản lượng nhưng giảm hài lòng.',
        lever: 'Mỗi chu kỳ dùng nguyên liệu (c), lao động (v) để tạo doanh thu; m = doanh thu − c − v. Dự báo giúp tránh thiếu tiền hoặc đình công.',
        safe: 'Chọn tái đầu tư 100%, 70% hoặc 30%; phần không tái đầu tư là tiêu dùng.',
        gate: 'Mỗi xưởng mới tăng sức chứa thêm 10 người. Sự kiện đối thủ phá sản có thể cho phép mua xưởng rẻ.',
      },
    },
    startGoal: 'Mục tiêu vốn: tổng tư bản đạt',
    consumerGoal: 'và thỏa mãn tiêu dùng tối thiểu {required}%',
    turnName: 'Chu kỳ',
    panelActions: 'THAO TÁC',
    panelStats: 'THỐNG KÊ',
    cash: 'Tiền mặt',
    capital: 'Tổng tư bản',
    goal: 'Mục tiêu',
    satisfaction: 'Mức hài lòng của công nhân',
    tableTitle: 'Dự tính chu kỳ này',
    cName: 'c',
    cFull: 'Tư bản bất biến',
    cDetail: 'nguyên liệu {materials} + khấu hao {depreciation}',
    vName: 'v',
    vFull: 'Tư bản khả biến',
    vDetail: 'lương {workers} công nhân',
    mName: 'm',
    mFull: 'Giá trị thặng dư',
    mDetail: 'doanh thu {revenue} − c − v',
    ratioOrganic: 'c/v · Cấu tạo hữu cơ',
    ratioSurplus: 'm/v · Tỷ suất thặng dư',
    definitions: {
      c: {
        title: 'Tư bản bất biến (c)',
        body: 'Chi phí cho nguyên liệu và phần giá trị máy móc bị hao mòn trong chu kỳ này.',
        example: 'Ví dụ kỳ này: nguyên liệu {materials} + khấu hao máy {depreciation} = c {total}.',
      },
      v: {
        title: 'Tư bản khả biến (v)',
        body: 'Tổng tiền lương ứng trước để thuê công nhân trong chu kỳ này.',
        example: 'Ví dụ kỳ này: lương của {workers} công nhân cộng lại là v {total}.',
        empty: 'Chưa thuê công nhân nên v hiện bằng $0.',
      },
      m: {
        title: 'Giá trị thặng dư (m)',
        body: 'Phần giá trị còn lại sau khi lấy doanh thu trừ chi phí c và tiền lương v.',
        example: 'Ví dụ kỳ này: doanh thu {revenue} − c {c} − v {v} = m {total}.',
      },
      organic: {
        title: 'Cấu tạo hữu cơ (c/v)',
        body: 'Cho biết chi phí máy móc và nguyên liệu lớn bao nhiêu so với tiền lương.',
        example: 'Ví dụ kỳ này: {c} / {v} = {ratio}; cứ mỗi $1 tiền lương thì có khoảng ${perWage} chi phí c.',
        empty: 'Chỉ số này sẽ có khi bạn thuê công nhân và v lớn hơn $0.',
      },
      surplus: {
        title: 'Tỷ suất thặng dư (m/v)',
        body: 'Cho biết giá trị thặng dư tạo ra bằng bao nhiêu phần trăm tiền lương.',
        example: 'Ví dụ kỳ này: {m} / {v} × 100% ≈ {ratio}; mỗi $100 tiền lương tạo ra khoảng ${perWage} thặng dư.',
        empty: 'Chỉ số này sẽ có khi bạn thuê công nhân và v lớn hơn $0.',
      },
    },
    world: {
      // Tên 5 khu vực tương tác, theo thứ tự phím 1-5
      zones: {
        machine: 'Khu máy móc',
        hr: 'Phòng nhân sự',
        lever: 'Cần gạt sản xuất',
        safe: 'Két sắt',
        gate: 'Cổng xưởng',
      },
      pressE: 'Nhấn E',
      controls: 'Click sàn: tự tìm đường · WASD/mũi tên: di chuyển · E: tương tác · 1-5: mở nhanh · Esc: đóng',
      menuKeys: '↑ ↓ chọn · Enter bấm · Esc đóng',
      factory: 'Xưởng',
      emptyLot: 'Đất trống',
      machine: 'Máy cấp',
      productivity: 'Năng suất',
      workers: 'Công nhân',
      wage: 'Lương hiện tại',
      producing: 'ĐANG SẢN XUẤT…',
      striking: 'CÔNG NHÂN ĐÌNH CÔNG',
      goSafe: 'Mang m = {m} về KÉT SẮT (phím 4) để phân bổ',
      toSafe: 'Mang m về két sắt',
      safeIdle: 'Két đang giữ {cash} tiền mặt. Sau mỗi chu kỳ sản xuất, quay lại đây để quyết định dùng giá trị thặng dư như thế nào.',
      leverBlocked: 'Hãy phân bổ m ở két sắt trước',
      gateInfo: 'Đang có {factories}/{max} xưởng, mỗi xưởng chứa {capacity} công nhân.',
    },
    actions: {
      hire: 'Thuê công nhân',
      hireSub: 'Lương {wage}/người',
      hireFull: 'Xưởng đã đầy',
      hireNoCash: 'Thiếu tiền ứng trước',
      upgrade: 'Nâng cấp máy móc',
      upgradeSub: '+{pct}% sản lượng',
      upgradeMax: 'Đã đạt cấp tối đa',
      factory: 'Mở xưởng mới',
      factorySub: 'Thêm {capacity} chỗ làm',
      factoryMax: 'Đã đủ {max} xưởng',
      raise: 'Tăng lương',
      raiseSub: 'Lương +{pct}% · hài lòng +{gain}',
      teamBuilding: 'Tổ chức Team Building',
      teamBuildingSub: 'Hài lòng +{gain}',
      usedThisTurn: 'Đã dùng chu kỳ này',
      noWorkers: 'Chưa có công nhân',
      overtime: 'ÉP TĂNG CA',
      overtimeOn: 'BẬT',
      overtimeOff: 'TẮT',
      overtimeSub: 'Sản lượng +{pct}% · hài lòng {loss}',
      produce: 'SẢN XUẤT',
      produceSub: 'Cần ứng thêm {advance} cho chu kỳ này',
      produceNoWorkers: 'Hãy thuê công nhân trước',
      riskyBuy: 'Mua xong sẽ thiếu tiền ứng trước',
    },
    forecast: {
      bankrupt: 'NGUY HIỂM: thiếu {missing} để ứng trước nguyên liệu và lương. Bấm SẢN XUẤT sẽ phá sản.',
      strikeNow: 'NGUY HIỂM: Mức hài lòng sẽ về 0, công nhân ĐÌNH CÔNG ngay chu kỳ này.',
      strikeSecond: 'NGUY HIỂM: đình công lần thứ 2 liên tiếp sẽ khiến bạn THUA.',
      overtimeHigh: 'Cảnh báo: thặng dư +{pct}% nhưng nguy cơ đình công cao (hài lòng còn {sat}).',
      overtime: 'Cảnh báo: thặng dư +{pct}% nhưng Mức hài lòng giảm còn {sat}.',
      low: 'Cảnh báo: Mức hài lòng thấp ({sat}). Tăng lương hoặc Team Building để tránh đình công.',
      ok: 'Dự báo: chu kỳ này thu về m = {m}.',
      idle: 'Thuê công nhân để bắt đầu tạo ra giá trị thặng dư.',
    },
    result: {
      title: 'KẾT QUẢ CHU KỲ {turn}',
      normal: 'Công nhân tạo ra giá trị mới lớn hơn tiền lương họ nhận. Phần dôi ra chính là giá trị thặng dư m.',
      overtime: 'Kéo dài ngày lao động trong khi lương giữ nguyên: m tăng nhờ nâng trình độ bóc lột sức lao động.',
      strikeTitle: 'ĐÌNH CÔNG',
      strike: 'Mức hài lòng về 0, xưởng dừng một chu kỳ. Bạn vẫn trả {cost} tiền lương và máy vẫn hao mòn dù không làm ra sản phẩm.',
      strikeLoseTitle: 'ĐÌNH CÔNG LẦN 2 LIÊN TIẾP',
      strikeLose: 'Công nhân không quay lại làm việc. Không có sức lao động thì tư bản không thể tự sinh ra giá trị thặng dư.',
      bankruptTitle: 'PHÁ SẢN',
      bankrupt: 'Tiền mặt {cash} không đủ ứng trước {advance} cho chu kỳ này. Sản xuất đình trệ, tư bản không quay vòng được.',
      allocateTitle: 'Bạn dùng giá trị thặng dư {m} như thế nào?',
      allocateNote: 'Tái đầu tư giữ tiền trong vốn sản xuất. Chi tiêu cá nhân làm tăng mức thỏa mãn nhu cầu tiêu dùng nhưng rút tiền khỏi vốn sản xuất; cần cân đối cả hai mục tiêu.',
      reinvest: 'vào tư bản',
      consume: 'chi tiêu cá nhân',
      consumerNeed: 'Nhu cầu tiêu dùng',
      consumerNeedHelp: 'Chi tiêu một phần giá trị thặng dư làm tăng thỏa mãn nhu cầu tiêu dùng. Cần đạt ít nhất {required}% và đồng thời chạm mục tiêu tư bản để thắng.',
      consumerGain: '+{points}% thỏa mãn',
      consumerNoGain: 'Không tăng thỏa mãn tiêu dùng',
      consumerRemaining: 'Còn cần chi {amount} để đạt mức mục tiêu',
      consumerSatisfied: 'Đã đạt mức thỏa mãn cần thiết',
      consumerStat: 'Thỏa mãn tiêu dùng',
      timeoutNeed: 'Bạn đã đạt mục tiêu tư bản nhưng chưa đáp ứng đủ nhu cầu tiêu dùng ({satisfaction}%/ {required}%). Hãy phân bổ thêm thặng dư cho tiêu dùng trước khi hết chu kỳ.',
      noSurplus: 'Chu kỳ này không có giá trị thặng dư để phân bổ.',
      next: 'Sang chu kỳ sau',
      toEnd: 'Xem phân tích',
      revenue: 'Doanh thu',
    },
    eventCommon: {
      label: 'SỰ KIỆN ĐẦU CHU KỲ',
      theory: 'Lý thuyết',
      noCash: 'Không đủ tiền',
    },
    events: {
      unemployment: {
        title: 'Nạn thất nghiệp',
        body: '{count} lao động thất nghiệp xin vào làm với lương {wage}, thấp hơn 60% so với công nhân của bạn ({normalWage}).',
        bodyReplace: ' Trong đó {replace} người sẽ thay thế công nhân lương cũ của bạn.',
        theory: 'Đội quân lao động dự trữ: người thất nghiệp sẵn sàng nhận lương thấp, tạo sức ép kéo tiền lương của người đang có việc xuống.',
        yes: 'Nhận thuê',
        no: 'Từ chối',
        effectYes: 'v giảm, m/v tăng · hài lòng {sat}',
      },
      machine: {
        title: 'Máy móc thế hệ mới',
        body: 'Dây chuyền mới giá {cost} giúp mỗi người làm ra nhiều hơn {pct}% và thay thế {fired} trong số {workers} công nhân.',
        theory: 'Tăng cấu tạo hữu cơ c/v: tư bản đổ vào máy tăng nhanh hơn tư bản trả lương, nên một phần công nhân trở thành lao động thừa.',
        yes: 'Mua máy',
        no: 'Không mua',
        effectYes: 'c/v tăng · sa thải {fired} người · hài lòng {sat}',
      },
      welfareTeamBuilding: {
        title: 'Công nhân đề xuất Team Building',
        body: 'Tập thể công nhân đề nghị công ty tổ chức một chuyến đi chung, chi phí {cost}.',
        theory: 'Trình độ bóc lột có giới hạn xã hội: nhượng bộ phúc lợi là cái giá để sức lao động tiếp tục làm ra giá trị thặng dư.',
        yes: 'Đồng ý',
        no: 'Từ chối',
        effectYes: 'Tốn {cost} · hài lòng +{gain}',
        effectNo: 'Hài lòng {loss}',
      },
      welfareLeave: {
        title: 'Công nhân xin nghỉ phép',
        body: 'Công nhân xin nghỉ phép luân phiên. Nếu đồng ý, sản lượng chu kỳ này giảm {pct}%.',
        theory: 'Rút ngắn thời gian lao động làm giảm m trước mắt, nhưng giữ cho sức lao động được tái sản xuất và tránh đình công.',
        yes: 'Đồng ý',
        no: 'Từ chối',
        effectYes: 'Sản lượng −{pct}% · hài lòng +{gain}',
        effectNo: 'Hài lòng {loss}',
      },
      rival: {
        title: 'Đối thủ nhỏ phá sản',
        body: 'Một xưởng nhỏ cạnh tranh không nổi phải bán lại với giá {cost}, chỉ bằng một nửa giá mở xưởng mới ({fullCost}).',
        theory: 'Tập trung tư bản: tư bản lớn thâu tóm tư bản nhỏ. Khác với tích tụ, là tự lớn lên bằng chính giá trị thặng dư của mình.',
        yes: 'Mua lại',
        no: 'Bỏ qua',
        effectYes: 'Thêm 1 xưởng, chứa thêm {capacity} công nhân',
      },
    },
    end: {
      winTitle: 'TÍCH LŨY THÀNH CÔNG',
      loseTitle: 'TÍCH LŨY THẤT BẠI',
      aiLabel: 'AI PHÂN TÍCH HÀNH TRÌNH CỦA BẠN',
      aiNote: 'Bộ luật viết sẵn dựa trên lịch sử quyết định, không dùng AI thật.',
      group1: '1. Bản chất tích lũy tư bản',
      group2: '2. Nhân tố ảnh hưởng quy mô tích lũy',
      group3: '3. Hệ quả của tích lũy',
      statCapital: 'Tổng tư bản',
      statSurplus: 'Tổng m tạo ra',
      statReinvest: 'Đã tích lũy',
      statConsume: 'Đã tiêu dùng',
      statOvertime: 'Ép tăng ca',
      statStrike: 'Đình công',
      times: 'lần',
      replay: 'Chơi lại',
    },
  },

  // Màn 3: các đoạn văn để bộ luật if/else ghép lại (xem src/game/analysis.ts)
  analysis: {
    verdict: {
      win: 'Sau {turns} chu kỳ, tư bản {start} đã lớn lên thành {capital}, vượt mục tiêu {target}; mức thỏa mãn tiêu dùng đạt {satisfaction}%, vượt yêu cầu {required}%. Bạn cân đối được cả tích lũy sản xuất lẫn nhu cầu tiêu dùng.',
      strike: 'Hai lần đình công liên tiếp đã chấm dứt việc sản xuất. Trình độ bóc lột bị đẩy quá mức: nguồn tạo ra giá trị thặng dư là sức lao động, và nó đã từ chối tiếp tục.',
      bankrupt: 'Tiền mặt không đủ ứng trước cho nguyên liệu và lương. Tư bản chỉ sinh lời khi quay vòng trọn vẹn: dồn quá nhiều vào một khâu thì chu kỳ sau không thể bắt đầu.',
      timeout: 'Hết {turns} chu kỳ, tư bản đạt {capital}/{target} và thỏa mãn tiêu dùng đạt {satisfaction}% (yêu cầu {required}%). Cần cân đối phần giá trị thặng dư đưa lại sản xuất với phần chi cho nhu cầu cá nhân.',
    },
    essence: {
      summary: 'Bạn thu về tổng cộng {surplus} giá trị thặng dư, đưa {reinvested} trở lại sản xuất và tiêu dùng {consumed}.',
      high: 'Gần như toàn bộ m được tư bản hóa. Đây là tái sản xuất mở rộng: thặng dư của chu kỳ trước trở thành tư bản bóc lột thêm lao động ở chu kỳ sau.',
      mixed: 'Bạn chia m thành hai quỹ: quỹ tích lũy và quỹ tiêu dùng của nhà tư bản. Tỷ lệ chia này quyết định trực tiếp tốc độ lớn lên của tư bản.',
      low: 'Phần lớn m bị tiêu dùng cá nhân nên gần với tái sản xuất giản đơn: quy mô sản xuất hầu như lặp lại như cũ, tư bản lớn rất chậm.',
      none: 'Chưa có giá trị thặng dư nào được tạo ra, nên cũng chưa có gì để tích lũy.',
    },
    factors: {
      exploitationLabel: 'Trình độ bóc lột',
      exploitationHigh: 'Bạn ép tăng ca {overtime} lần và gặp {strikes} lần đình công. Tăng m/v làm m lớn nhanh, nhưng vấp phải sự phản kháng của công nhân.',
      exploitationSoft: 'Bạn tăng lương {raises} lần và tổ chức Team Building {teamBuildings} lần. Nhượng bộ làm m/v thấp hơn, đổi lại sản xuất không bị gián đoạn.',
      exploitationMid: 'Bạn giữ m/v ở mức vừa phải, ép tăng ca {overtime} lần. Tỷ suất cuối cùng là {rate}%.',
      productivityLabel: 'Năng suất lao động',
      productivityHigh: 'Máy đạt cấp {level}: cùng số công nhân làm ra nhiều sản phẩm hơn hẳn, nên m tăng mà không cần kéo dài ngày lao động.',
      productivityLow: 'Máy chỉ ở cấp {level}. Năng suất thấp nên muốn tăng m bạn buộc phải dựa vào số lượng công nhân và cường độ lao động.',
      efficiencyLabel: 'Sử dụng hiệu quả tư bản',
      efficiency: 'Máy trị giá {machineCost} tham gia toàn bộ vào sản xuất nhưng mỗi chu kỳ chỉ chuyển {depreciation} vào sản phẩm. Phần chênh lệch phục vụ không công.',
      efficiencyNone: 'Bạn không mua máy nên không tận dụng được việc máy móc phục vụ nhiều chu kỳ trong khi chỉ hao mòn dần.',
      scaleLabel: 'Quy mô tư bản ứng trước',
      scale: {
        startup: 'Với {start}, bạn chỉ thuê nổi vài công nhân lúc đầu. Tư bản nhỏ thì lượng m tuyệt đối nhỏ, tích lũy khởi động rất chậm.',
        middle: 'Với {start}, bạn lấp đầy được một xưởng ngay từ đầu, nhưng mỗi quyết định mua máy hay mở xưởng đều phải đánh đổi.',
        heir: 'Với {start}, bạn mua ngay được máy tốt và nhiều xưởng. Tư bản ứng trước lớn thì lượng m thu về mỗi chu kỳ lớn tương ứng.',
      },
    },
    consequences: {
      organicLabel: 'Tăng cấu tạo hữu cơ',
      organicHigh: 'Bạn chi {machineShare}% vốn đầu tư cho máy. Cấu tạo hữu cơ c/v lên tới {organic}: tư bản bất biến tăng nhanh hơn tư bản khả biến.',
      organicLow: 'Chỉ {machineShare}% vốn đầu tư vào máy, c/v dừng ở {organic}. Tư bản của bạn lớn lên chủ yếu bằng cách thuê thêm lao động.',
      concentrationLabel: 'Tích tụ và tập trung',
      concentrationBoth: 'Bạn mở {opened} xưởng bằng m của mình (tích tụ) và thâu tóm {acquired} xưởng của đối thủ phá sản (tập trung).',
      concentrationOwn: 'Bạn mở thêm {opened} xưởng bằng chính m tích lũy được. Đó là tích tụ tư bản: tư bản cá biệt tự lớn lên.',
      concentrationRival: 'Bạn thâu tóm {acquired} xưởng của đối thủ phá sản. Đó là tập trung tư bản: tư bản lớn nuốt tư bản nhỏ, tổng tư bản xã hội không tăng.',
      concentrationNone: 'Bạn vẫn chỉ có một xưởng. Chưa có tích tụ đủ lớn để mở rộng, cũng chưa thâu tóm được tư bản nào khác.',
      reserveLabel: 'Đội ngũ lao động dự trữ',
      reserveBoth: 'Bạn sa thải {laidOff} người vì máy mới và thuê {cheap} người thất nghiệp với lương thấp. Tích lũy vừa tạo ra, vừa lợi dụng lao động dự trữ.',
      reserveLaidOff: 'Máy mới khiến {laidOff} công nhân mất việc. Tích lũy tư bản tự tạo ra nhân khẩu thừa tương đối.',
      reserveCheap: 'Bạn thuê {cheap} người thất nghiệp với lương thấp hơn 60%. Lao động dự trữ giúp nhà tư bản ép giá sức lao động.',
      reserveNone: 'Bạn không sa thải vì máy và không thuê lao động giá rẻ. Trong thực tế, cạnh tranh sẽ buộc nhà tư bản phải làm cả hai.',
    },
  },
}

export type Tier = (typeof CONFIG.tiers)[number]
