// settingsController.js
// 홍보바 설정을 조회/수정하는 컨트롤러 함수 모음
const Settings = require('../models/settings');

const DEFAULT_PROMO_MESSAGE = '10년의 감사, 단 10일간의 특별한 혜택';

const sanitizePromoMessages = (messages = [], fallbackText = DEFAULT_PROMO_MESSAGE) => {
  const filtered = messages
    .filter((msg) => msg && typeof msg.text === 'string' && msg.text.trim().length > 0)
    .map((msg) => ({
      text: msg.text.trim(),
      isActive: Boolean(msg.isActive)
    }));

  if (filtered.length === 0) {
    return [
      {
        text: fallbackText,
        isActive: true
      }
    ];
  }

  const hasActive = filtered.some((msg) => msg.isActive);
  if (!hasActive) {
    filtered[0].isActive = true;
  }

  return filtered;
};

// 홍보바 설정 가져오기
exports.getPromoBar = async (req, res) => {
  try {
    let promoBar = await Settings.findOne({ key: 'promoBar' });
    
    // 설정이 없으면 기본값 생성
    if (!promoBar) {
      const sanitizedMessages = sanitizePromoMessages(messages, value || DEFAULT_PROMO_MESSAGE);
      promoBar = await Settings.create({
        key: 'promoBar',
        value: value || sanitizedMessages[0].text,
        isActive: true,
        messages: sanitizedMessages
      });
    } else {
      // 기존 문구 배열이 없을 경우 기본 문구 추가
      if (!promoBar.messages || promoBar.messages.length === 0) {
        const fallbackText = promoBar.value || DEFAULT_PROMO_MESSAGE;
        promoBar.messages = [
          {
            text: fallbackText,
            isActive: true
          }
        ];
        promoBar.value = fallbackText;
        await promoBar.save();
      }
    }
    
    const activeMessage = (promoBar.messages || []).find((message) => message.isActive);
    const response = promoBar.toObject();
    response.currentValue = activeMessage ? activeMessage.text : (promoBar.value || '');
    
    res.json({ success: true, settings: response });
  } catch (error) {
    console.error('홍보바 설정 가져오기 오류:', error);
    res.status(500).json({ success: false, error: '홍보바 설정을 가져오는 중 오류가 발생했습니다.' });
  }
};

// 홍보바 설정 업데이트
exports.updatePromoBar = async (req, res) => {
  try {
    const { value, isActive, messages } = req.body;
    
    console.log('홍보바 업데이트 요청:', { value, isActive, messagesCount: messages?.length });
    
    let promoBar = await Settings.findOne({ key: 'promoBar' });
    
    if (!promoBar) {
      // 설정이 없으면 생성
      const sanitizedMessages = sanitizePromoMessages(messages, value || DEFAULT_PROMO_MESSAGE);
      console.log('새 홍보바 설정 생성:', sanitizedMessages);
      promoBar = await Settings.create({
        key: 'promoBar',
        value: value || sanitizedMessages[0]?.text || DEFAULT_PROMO_MESSAGE,
        isActive: isActive !== undefined ? isActive : true,
        messages: sanitizedMessages
      });
    } else {
      // 문구 배열 업데이트
      if (Array.isArray(messages)) {
        const sanitizedMessages = sanitizePromoMessages(messages, value || promoBar.value || DEFAULT_PROMO_MESSAGE);
        console.log('문구 배열 업데이트:', sanitizedMessages);
        promoBar.messages = sanitizedMessages;
      }

      // 기존 설정 업데이트
      if (value !== undefined) {
        promoBar.value = value;
      }
      if (isActive !== undefined) promoBar.isActive = isActive;

      // value가 없거나 messages가 제공된 경우 첫 번째 활성 메시지로 설정
      if (!promoBar.value || (messages && Array.isArray(messages))) {
        const activeMessage =
          (promoBar.messages || []).find((message) => message.isActive) || promoBar.messages?.[0];
        if (activeMessage) {
          promoBar.value = activeMessage.text;
        }
      }
    }

    await promoBar.save();
    console.log('홍보바 저장 완료:', promoBar.messages);

    const activeMessage =
      (promoBar.messages || []).find((message) => message.isActive) || promoBar.messages?.[0];
    const response = promoBar.toObject();
    response.currentValue = activeMessage ? activeMessage.text : (promoBar.value || '');
    
    res.json({ success: true, settings: response });
  } catch (error) {
    console.error('홍보바 설정 업데이트 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: '홍보바 설정을 업데이트하는 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
};

