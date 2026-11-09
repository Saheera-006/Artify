package com.artify;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.artify.exception.ApiException;
import com.artify.service.*;
import com.fasterxml.jackson.databind.*;
import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.Test;

class EvaluationServiceTest {
  ObjectMapper mapper = new ObjectMapper();
  ImageService images = mock(ImageService.class);
  GeminiService gemini = mock(GeminiService.class);

  EvaluationService service() throws Exception {
    return new EvaluationService(images, gemini);
  }

  JsonNode json(String s) throws Exception {
    return mapper.readTree(s);
  }

  List<EvaluationService.Criterion> criteria() {
    return List.of(
        new EvaluationService.Criterion("Design", new BigDecimal("100"), "Visible quality"));
  }

  @Test
  void rejectsBadTotalBeforeNetworkCall() throws Exception {
    var service = service();
    assertThrows(
        ApiException.class,
        () ->
            service.evaluate(
                json(
                    """
{"fileUrl":"https://res.cloudinary.com/demo/image/upload/x.png","round":{"criteria":[{"name":"Design","maxScore":20}]}}
""")));
    verifyNoInteractions(images, gemini);
  }

  @Test
  void calculatesTotalRatherThanTrustingModelTotal() throws Exception {
    var result =
        service()
            .normalize(
                json(
                    """
{"criteria":[{"name":"Design","score":72.5,"maxScore":900,"reason":"Visible evidence"}],"totalScore":999,"summary":"Good"}
"""),
                criteria());
    assertEquals(new BigDecimal("72.5"), result.get("totalScore"));
    assertEquals(100, result.get("maxTotalScore"));
  }

  @Test
  void rejectsOutOfRangeScore() throws Exception {
    var service = service();
    assertThrows(
        ApiException.class,
        () ->
            service.normalize(
                json(
                    """
                    {"criteria":[{"name":"Design","score":101}]}
                    """),
                criteria()));
  }

  @Test
  void rejectsWrongCriterionOrder() throws Exception {
    var service = service();
    assertThrows(
        ApiException.class,
        () ->
            service.normalize(
                json(
                    """
                    {"criteria":[{"name":"Different","score":80}]}
                    """),
                criteria()));
  }

  @Test
  void rejectsMissingCriteria() throws Exception {
    var service = service();
    assertThrows(ApiException.class, () -> service.normalize(json("{}"), criteria()));
  }

  @Test
  void keepsApiResponseContract() throws Exception {
    when(images.evaluationUrl(anyString())).thenReturn("https://example.test/evaluation.jpg");
    when(images.download(anyString())).thenReturn(new ImageService.ImageData("data", "image/jpeg"));
    when(gemini.generate(anyString(), any()))
        .thenReturn(
            json(
                """
                {"criteria":[{"name":"Design","score":80,"reason":"Readable"}],"summary":"Clear"}
                """));
    var result =
        service()
            .evaluate(
                json(
                    """
{"fileUrl":"image","designType":"ui","round":{"criteria":[{"name":"Design","maxScore":100}]}}
"""));
    assertEquals(Set.of("evaluation", "sourceType", "evaluationUrl"), result.keySet());
    assertEquals("image", result.get("sourceType"));
  }

  @Test
  void cloudinaryPdfTransformsWithoutLosingQuery() {
    ImageService image = new ImageService("demo");
    assertEquals(
        "https://res.cloudinary.com/demo/image/upload/f_jpg/v1/design.pdf?x=1",
        image.evaluationUrl("https://res.cloudinary.com/demo/image/upload/v1/design.pdf?x=1"));
  }

  @Test
  void preventsArbitraryServerSideDownloads() {
    ImageService image = new ImageService("demo");
    for (String url :
        List.of(
            "http://127.0.0.1/a.png",
            "https://res.cloudinary.com.evil.test/demo/image/upload/a.png",
            "https://res.cloudinary.com/other/image/upload/a.png",
            "https://res.cloudinary.com/demo/image/fetch/https://127.0.0.1"))
      assertThrows(ApiException.class, () -> image.evaluationUrl(url));
  }
}
