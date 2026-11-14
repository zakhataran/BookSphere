package org.project.service;

import org.project.dto.AiBookAnalysisResponseDto;
import org.springframework.web.multipart.MultipartFile;

public interface AiService {

    AiBookAnalysisResponseDto analyzeBookPdf(MultipartFile file);

    float[] generatedEmbedding(String text);
}